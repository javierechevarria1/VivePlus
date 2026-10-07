import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function requireUser(req: NextRequest) {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return { error: "No autorizado" };
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const user_id = (payload.id ?? payload.medicoId) as number | undefined;
    if (!user_id) return { error: "No autorizado" };
    return { user_id };
  } catch {
    return { error: "Token inválido" };
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { latitud, longitud } = await req.json();

  if (latitud == null || longitud == null) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE usuarios SET latitud = $1, longitud = $2 WHERE id = $3`,
      [latitud, longitud, auth.user_id]
    );
    return NextResponse.json({ ok: true });
  } finally {
    client.release();
  }
}