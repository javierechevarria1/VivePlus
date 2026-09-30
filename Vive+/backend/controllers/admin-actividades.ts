import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";
import { pusher } from "@/backend/services/pusher";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

async function requireAdmin(req: NextRequest): Promise<{ error: NextResponse } | { rol: string }> {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.rol !== "admin") {
      return { error: NextResponse.json({ error: "Acceso restringido a administradores" }, { status: 403 }) };
    }
    return { rol: payload.rol as string };
  } catch {
    return { error: NextResponse.json({ error: "Token inválido" }, { status: 401 }) };
  }
}


export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const { rows } = await pool.query(`
      SELECT a.id, a.nombre, a.descripcion,
             a.actividades_categoria_id,
             COALESCE(ca.nombre, '') AS categoria,
             a.fecha, a.lugar,
             a.plazas_max, a.url_mas_info AS url, a.url_lugar,
             a.duracion_min, a.creado_en, a.imagen,
             (a.estado = 'activa') AS activa,
             COUNT(i.id)::int AS inscritos
      FROM actividades a
      LEFT JOIN categorias_actividades ca ON ca.id = a.actividades_categoria_id
      LEFT JOIN actividad_inscripciones i ON i.actividad_id = a.id
      GROUP BY a.id, ca.nombre
      ORDER BY a.fecha ASC
    `);
    return NextResponse.json({ actividades: rows });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { nombre, descripcion, actividades_categoria_id, fecha, lugar, plazas_max, duracion_min, url_lugar, url, activa, imagen } = body;

  if (!nombre?.trim() || !fecha) {
    return NextResponse.json({ error: "nombre y fecha son obligatorios" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO actividades (nombre, descripcion, actividades_categoria_id, fecha, lugar, plazas_max, duracion_min, url_lugar, url_mas_info, estado, imagen)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        nombre.trim(),
        descripcion ?? "",
        actividades_categoria_id ?? null,
        fecha,
        lugar ?? "",
        Number(plazas_max ?? 0),
        duracion_min != null && duracion_min !== "" ? Number(duracion_min) : null,
        url_lugar?.trim() || null,
        url?.trim() || null,
        activa !== false ? "activa" : "inactiva",
        imagen?.trim() || null,
      ]
    );
    void pusher.trigger("actividades", "lista-actualizada", {});
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { id, nombre, descripcion, actividades_categoria_id, fecha, lugar, plazas_max, duracion_min, url_lugar, url, activa, imagen } = body;

  if (!id) {
    return NextResponse.json({ error: "id es obligatorio" }, { status: 400 });
  }

  try {
    await pool.query(
      `UPDATE actividades
       SET nombre = $1, descripcion = $2, actividades_categoria_id = $3, fecha = $4,
           lugar = $5, plazas_max = $6, duracion_min = $7,
           url_lugar = $8, url_mas_info = $9, estado = $10, imagen = $11
       WHERE id = $12`,
      [
        nombre?.trim() ?? "",
        descripcion ?? "",
        actividades_categoria_id ?? null,
        fecha,
        lugar ?? "",
        Number(plazas_max ?? 0),
        duracion_min != null && duracion_min !== "" ? Number(duracion_min) : null,
        url_lugar?.trim() || null,
        url?.trim() || null,
        activa !== false ? "activa" : "inactiva",
        imagen?.trim() || null,
        Number(id),
      ]
    );
    void pusher.trigger("actividades", "lista-actualizada", {});
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id es obligatorio" }, { status: 400 });
  }

  try {
    
    await pool.query("DELETE FROM actividad_inscripciones WHERE actividad_id = $1", [Number(id)]);
    await pool.query("DELETE FROM actividades WHERE id = $1", [Number(id)]);
    void pusher.trigger("actividades", "lista-actualizada", {});
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
