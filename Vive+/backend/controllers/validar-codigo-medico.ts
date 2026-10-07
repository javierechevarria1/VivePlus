import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { codigo } = await req.json();
  if (!codigo || typeof codigo !== "string" || !codigo.trim()) {
    return NextResponse.json({ error: "Código requerido" }, { status: 400 });
  }

  const result = await pool.query(
    "SELECT id, estado FROM codigos_invitacion_medico WHERE codigo = $1",
    [codigo.trim()]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Código de invitación no válido" }, { status: 400 });
  }
  if (result.rows[0].estado) {
    return NextResponse.json({ error: "Este código ya ha sido utilizado" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
