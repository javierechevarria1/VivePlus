import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const intermediarioId = searchParams.get("intermediario_id");

  if (!intermediarioId) {
    return NextResponse.json({ error: "Falta intermediario_id" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.edad
       FROM usuarios_dependientes ud
       JOIN usuarios u ON u.id = ud.usuario_dependiente_id
       WHERE ud.usuario_intermediario_id = $1
       ORDER BY u.username ASC`,
      [parseInt(intermediarioId)]
    );

    return NextResponse.json({ users: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[GET /api/mis-usuarios]", message);
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}
