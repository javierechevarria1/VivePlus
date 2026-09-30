import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const tokenRes = await client.query(
      `SELECT email, expires_at FROM password_reset_tokens
       WHERE token = $1 AND used = FALSE AND expires_at > NOW()
       LIMIT 1`,
      [token]
    );

    if (tokenRes.rows.length === 0) {
      return NextResponse.json(
        { error: "El enlace no es válido o ha caducado. Solicita uno nuevo." },
        { status: 400 }
      );
    }

    const { email } = tokenRes.rows[0];
    const hash = await bcrypt.hash(password, 12);

    await Promise.all([
      client.query(`UPDATE usuarios SET password = $1 WHERE LOWER(email) = LOWER($2)`, [hash, email]),
      client.query(`UPDATE medicos SET password = $1 WHERE LOWER(email) = LOWER($2)`, [hash, email]),
      client.query(`UPDATE password_reset_tokens SET used = TRUE WHERE token = $1`, [token]),
    ]);

    return NextResponse.json({ ok: true });
  } finally {
    client.release();
  } 
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ valid: false });
  }

  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id FROM password_reset_tokens
       WHERE token = $1 AND used = FALSE AND expires_at > NOW()
       LIMIT 1`, 
      [token]
    );
    return NextResponse.json({ valid: res.rows.length > 0 });
  } finally {
    client.release();
  }
}
