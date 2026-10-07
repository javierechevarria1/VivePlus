import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const excludeId = searchParams.get("exclude_id");

  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, username FROM usuarios
       WHERE username ILIKE $1
         AND ($2::int IS NULL OR id != $2)
         AND COALESCE(rol, 1) != 5
       ORDER BY username ASC
       LIMIT 10`,
      [`%${q}%`, excludeId ? parseInt(excludeId) : null]
    );
    return NextResponse.json({ users: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[GET /api/buscar-usuarios]", message);
    return NextResponse.json({ error: "Error al buscar usuarios" }, { status: 500 });
  }
}
