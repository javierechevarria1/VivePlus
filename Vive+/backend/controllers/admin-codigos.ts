import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import crypto from "crypto";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function requireAdmin(req: NextRequest): Promise<{ error: NextResponse } | { rol: string }> {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
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

  const result = await pool.query(
    "SELECT id, codigo, estado FROM codigos_invitacion_medico ORDER BY id DESC"
  );
  return NextResponse.json({ codigos: result.rows });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const codigo = crypto.randomBytes(6).toString("hex").toUpperCase();
  await pool.query(
    "INSERT INTO codigos_invitacion_medico (codigo, estado) VALUES ($1, FALSE)",
    [codigo]
  );
  return NextResponse.json({ codigo }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  await pool.query("DELETE FROM codigos_invitacion_medico WHERE id = $1 AND estado = FALSE", [id]);
  return NextResponse.json({ ok: true });
}
