import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";

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
      SELECT
        m.id,
        m.usuario_medico_id,
        u.username AS name,
        m.especialidad,
        m.tag,
        m.horario,
        m.categorias_salud_id,
        COALESCE(cs.nombre, m.tipo, '') AS tipo,
        cs.color AS categoria_color,
        m.photo_url,
        COALESCE(ROUND(AVG(v.rating)::numeric, 1), 0) AS rating,
        COUNT(v.id)::integer AS reviews
      FROM medicos m
      JOIN usuarios u ON u.id = m.usuario_medico_id
      LEFT JOIN categorias_salud cs ON cs.id = m.categorias_salud_id
      LEFT JOIN valoraciones_medico v ON v.usuario_medico_id = m.id
      GROUP BY m.id, u.username, m.especialidad, m.tag, m.horario, m.tipo,
               m.categorias_salud_id, m.photo_url, cs.nombre, cs.color
      ORDER BY m.id
    `);

    const medicos = rows.map((m: Record<string, unknown>) => ({
      id:                  Number(m.id),
      usuario_medico_id:   Number(m.usuario_medico_id),
      name:                String(m.name ?? ""),
      especialidad:        String(m.especialidad ?? ""),
      tag:                 String(m.tag ?? ""),
      horario:             String(m.horario ?? ""),
      categorias_salud_id: m.categorias_salud_id ? Number(m.categorias_salud_id) : null,
      tipo:                String(m.tipo ?? ""),
      categoria_color:     m.categoria_color ? String(m.categoria_color) : "#2A7A6A",
      photo_url:           m.photo_url ? String(m.photo_url) : null,
      rating:              parseFloat(String(m.rating ?? "0")),
      reviews:             Number(m.reviews ?? 0),
    }));

    return NextResponse.json({ medicos });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { usuario_medico_id, especialidad, tag, horario, categorias_salud_id, photo_url } = body;

  if (!usuario_medico_id || !especialidad?.trim()) {
    return NextResponse.json(
      { error: "usuario_medico_id y especialidad son obligatorios" },
      { status: 400 }
    );
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO medicos (usuario_medico_id, especialidad, tag, horario, categorias_salud_id, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        Number(usuario_medico_id),
        especialidad.trim(),
        tag?.trim() || null,
        horario?.trim() || null,
        categorias_salud_id || null,
        photo_url?.trim() || null,
      ]
    );
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { id, especialidad, tag, horario, categorias_salud_id, photo_url } = body;

  if (!id) {
    return NextResponse.json({ error: "id es obligatorio" }, { status: 400 });
  }

  try {
    await pool.query(
      `UPDATE medicos
       SET especialidad = $1, tag = $2, horario = $3, categorias_salud_id = $4, photo_url = $5
       WHERE id = $6`,
      [
        especialidad?.trim() ?? "",
        tag?.trim() || null,
        horario?.trim() || null,
        categorias_salud_id || null,
        photo_url?.trim() || null,
        Number(id),
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
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

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT usuario_medico_id FROM medicos WHERE id = $1`,
      [Number(id)]
    );
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });
    }
    const usuarioId = rows[0].usuario_medico_id;

    const { rows: chatRows } = await client.query(
      `SELECT id FROM chat WHERE usuario_escritor_id = $1 OR usuario_receptor_id = $1`,
      [usuarioId]
    );
    const chatIds = chatRows.map(r => r.id);

    await Promise.all([
      client.query(`DELETE FROM valoraciones_medico WHERE usuario_medico_id = $1`, [Number(id)]),
      client.query(`DELETE FROM valoraciones_medico WHERE usuario_id = $1`, [usuarioId]),
      client.query(`DELETE FROM medicos WHERE id = $1`, [Number(id)]),
      client.query(`DELETE FROM logins WHERE usuario_id = $1`, [usuarioId]),
    ]);

    if (chatIds.length > 0) {
      await client.query(`DELETE FROM chat_mensajes WHERE chat_id = ANY($1::int[])`, [chatIds]);
      await client.query(`DELETE FROM chat WHERE id = ANY($1::int[])`, [chatIds]);
    }

    await client.query(`DELETE FROM usuarios WHERE id = $1`, [usuarioId]);

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}
