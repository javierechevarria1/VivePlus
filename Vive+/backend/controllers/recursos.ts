import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { pusher } from "@/backend/services/pusher";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const usuarioId      = searchParams.get("usuario_id");
  const intermediarioId = searchParams.get("intermediario_id");
  const actividadId    = searchParams.get("actividad_id");
  const cats = searchParams.getAll("categoria[]").length > 0
    ? searchParams.getAll("categoria[]")
    : searchParams.get("categoria")
      ? [searchParams.get("categoria")!]
      : [];

  
  if (intermediarioId && actividadId) {
    try {
      const { rows: selfRows } = await pool.query(
        `SELECT 1 FROM actividad_inscripciones
         WHERE actividad_id = $1 AND usuario_id = $2`,
        [parseInt(actividadId), parseInt(intermediarioId)]
      );

      const { rows: personas } = await pool.query(
        `SELECT u.id, u.username
         FROM usuarios_dependientes ud
         JOIN usuarios u ON u.id = ud.usuario_dependiente_id
         JOIN actividad_inscripciones ai ON ai.usuario_id = u.id AND ai.actividad_id = $1
         WHERE ud.usuario_intermediario_id = $2`,
        [parseInt(actividadId), parseInt(intermediarioId)]
      );

      return NextResponse.json({ personas, selfInscrito: selfRows.length > 0 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  try {
    let query = `
      SELECT a.id, a.nombre, a.descripcion, a.categoria, a.fecha, a.lugar,
             a.plazas_max, a.url_mas_info AS url, a.url_lugar, a.duracion_min,
             a.imagen, COUNT(i.id)::int AS inscritos
      FROM actividades a
      LEFT JOIN actividad_inscripciones i ON i.actividad_id = a.id
      WHERE a.estado = 'activa'
    `;
    const params: unknown[] = [];

    if (cats.length > 0) {
      params.push(cats);
      query += ` AND a.categoria = ANY($${params.length}::text[])`;
    }

    query += " GROUP BY a.id ORDER BY a.fecha ASC";

    const { rows: actividades } = await pool.query(query, params);

    let inscritas: number[] = [];
    if (usuarioId) {
      const { rows } = await pool.query(
        `SELECT DISTINCT actividad_id FROM actividad_inscripciones WHERE usuario_id = $1
         UNION
         SELECT DISTINCT ai.actividad_id
         FROM actividad_inscripciones ai
         JOIN usuarios_dependientes ud ON ai.usuario_id = ud.usuario_dependiente_id
         WHERE ud.usuario_intermediario_id = $1`,
        [usuarioId]
      );
      inscritas = rows.map((r: { actividad_id: number }) => r.actividad_id);
    }

    return NextResponse.json({ actividades, inscritas });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[GET /api/recursos]", message);
    return NextResponse.json({ error: "Error al obtener actividades", detail: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { actividad_id, usuario_id, personas_lista, include_intermediario } = await req.json();
    if (!actividad_id || !usuario_id) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    
    const ids: number[] = Array.isArray(personas_lista) ? personas_lista.map((p: { id: number }) => p.id) : [];
    if (!personas_lista || include_intermediario) ids.push(usuario_id);

    const { rows: [act] } = await pool.query(
      "SELECT plazas_max FROM actividades WHERE id = $1",
      [actividad_id]
    );
    const { rows: [cnt] } = await pool.query(
      "SELECT COUNT(*)::int AS total FROM actividad_inscripciones WHERE actividad_id = $1",
      [actividad_id]
    );
    if (act.plazas_max > 0 && cnt.total + ids.length > act.plazas_max) {
      return NextResponse.json({ error: "No hay suficientes plazas disponibles" }, { status: 409 });
    }

    await Promise.all(ids.map(async uid => {
      const { rows: existing } = await pool.query(
        "SELECT id FROM actividad_inscripciones WHERE actividad_id = $1 AND usuario_id = $2",
        [actividad_id, uid]
      );
      if (existing.length > 0) return;
      await pool.query(
        "INSERT INTO actividad_inscripciones (actividad_id, usuario_id, fecha_inscripcion) VALUES ($1, $2, NOW())",
        [actividad_id, uid]
      );
    }));

    const { rows: [updated] } = await pool.query(
      "SELECT COUNT(*)::int AS inscritos FROM actividad_inscripciones WHERE actividad_id = $1",
      [actividad_id]
    );
    await Promise.all([
      pool.query("UPDATE actividades SET total_inscritos = $1 WHERE id = $2", [updated.inscritos, actividad_id]),
      pusher.trigger("actividades", "cambio-inscritos", { actividad_id, inscritos: updated.inscritos }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/recursos]", message);
    return NextResponse.json({ error: "Error al inscribirse", detail: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { actividad_id, usuario_id, personas_ids, cancel_self } = await req.json();
    if (!actividad_id || !usuario_id) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    
    const ids: number[] = Array.isArray(personas_ids) ? [...personas_ids] : [usuario_id];
    if (cancel_self && !ids.includes(usuario_id)) ids.push(usuario_id);

    await Promise.all(ids.map(uid =>
      pool.query(
        "DELETE FROM actividad_inscripciones WHERE actividad_id = $1 AND usuario_id = $2",
        [actividad_id, uid]
      )
    ));

    if (ids.length === 0) {
      return NextResponse.json({ error: "No se seleccionó ninguna persona" }, { status: 400 });
    }

    const { rows: [updated] } = await pool.query(
      "SELECT COUNT(*)::int AS inscritos FROM actividad_inscripciones WHERE actividad_id = $1",
      [actividad_id]
    );
    await Promise.all([
      pool.query("UPDATE actividades SET total_inscritos = $1 WHERE id = $2", [updated.inscritos, actividad_id]),
      pusher.trigger("actividades", "cambio-inscritos", { actividad_id, inscritos: updated.inscritos }),
    ]);

    return NextResponse.json({ ok: true, inscritos: updated.inscritos });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[DELETE /api/recursos]", message);
    return NextResponse.json({ error: "Error al desinscribirse", detail: message }, { status: 500 });
  }
}
