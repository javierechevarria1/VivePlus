import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

/*
  Tabla necesaria en PostgreSQL:

  CREATE TABLE IF NOT EXISTS valoraciones_medico (
    id          SERIAL PRIMARY KEY,
    medico_id   INTEGER NOT NULL REFERENCES medicos(id),
    usuario_id  INTEGER NOT NULL REFERENCES usuarios(id),
    rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comentario  TEXT,
    creado_en   TIMESTAMP DEFAULT NOW()
  );
*/

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const medicoId = searchParams.get("medico_id");
    if (!medicoId) {
      return NextResponse.json({ error: "Falta medico_id" }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT id,
              'Anónimo' || id AS nombre,
              rating,
              comentario,
              creado_en
       FROM valoraciones_medico
       WHERE usuario_medico_id = $1
       ORDER BY creado_en DESC
       LIMIT 50`,
      [medicoId]
    );

    return NextResponse.json({ valoraciones: result.rows });
  } catch (err) {
    console.error("Error obteniendo valoraciones:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { medico_id, usuario_id, rating, comentario } = await req.json();

    if (!medico_id || !usuario_id) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Valoración inválida" }, { status: 400 });
    }

    // Guardar la valoración
    await pool.query(
      `INSERT INTO valoraciones_medico (usuario_medico_id, rating, comentario)
       VALUES ($1, $2, $3)`,
      [medico_id, rating, comentario?.trim() || null]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error guardando valoración:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
