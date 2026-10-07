import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { usuario_id, descripcion, necesidades, productos_sugeridos } = await req.json();

    if (!usuario_id) {
      return NextResponse.json({ error: "Falta usuario_id" }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO cotizaciones (usuario_id, descripcion, necesidades, productos_sugeridos, creado_en)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        usuario_id,
        descripcion ?? null,
        JSON.stringify(necesidades ?? []),
        JSON.stringify(productos_sugeridos ?? []),
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error al guardar cotización:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
