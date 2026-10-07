import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT t.id,
              'Anónimo' AS nombre,
              t.vinculo AS rol,
              t.texto,
              t.rating,
              t.creado_en
       FROM testimonios t
       ORDER BY t.creado_en DESC
       LIMIT 12`
    );
    return NextResponse.json({ testimonios: result.rows });
  } catch (err) {
    console.error("Error testimonios:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { vinculo, texto, rating, usuario_id } = await req.json();

    if (!vinculo?.trim() || !texto?.trim()) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO testimonios (usuario_id, vinculo, texto, rating, creado_en)
       VALUES ($1, $2, $3, $4, NOW())`,
      [usuario_id ?? null, vinculo.trim(), texto.trim(), Number(rating) || 5]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error al guardar testimonio:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
