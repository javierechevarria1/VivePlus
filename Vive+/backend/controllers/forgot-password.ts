import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  // Máx. 5 solicitudes por IP cada 15 min para evitar spam de correos.
  if (rateLimit(`forgot:${clientIp(req)}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Inténtalo de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  const emailNorm = email.toLowerCase().trim();
  const client = await pool.connect();

  try {
    // Las credenciales (incluidas las de médicos) viven en `usuarios`; los
    // médicos se localizan por su email aquí igual que cualquier otro usuario.
    const userRes = await client.query(
      `SELECT id, username AS nombre FROM usuarios WHERE LOWER(email) = $1 LIMIT 1`,
      [emailNorm]
    );

    const persona = userRes.rows[0];

    if (!persona) {
      return NextResponse.json({ ok: true });
    }

    await client.query(
      `UPDATE password_reset_tokens SET used = TRUE WHERE email = $1`,
      [emailNorm]
    );

    const token     = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await client.query(
      `INSERT INTO password_reset_tokens (email, token, expires_at) VALUES ($1, $2, $3)`,
      [emailNorm, token, expiresAt]
    );

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from:    `"Relatie65" <${process.env.SMTP_USER}>`,
      to:      email.trim(),
      subject: "🔑 Restablecer tu contraseña — Relatie65",
      html: `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#F7F5F1;border-radius:16px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h2 style="color:#1A5245;margin:0 0 4px;">Relatie65</h2>
    <p style="color:#6B7C74;font-size:13px;margin:0;">Recuperación de contraseña</p>
  </div>
  <div style="background:white;border-radius:12px;padding:24px;border:1px solid #EDE8DF;margin-bottom:16px;">
    <p style="color:#2A3830;font-size:15px;margin:0 0 16px;">Hola, <strong>${persona.nombre}</strong></p>
    <p style="color:#6B7C74;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta. Pulsa el botón para crear una nueva:
    </p>
    <div style="text-align:center;">
      <a href="${resetUrl}"
        style="display:inline-block;background:linear-gradient(135deg,#1A5245,#2A7A6A);color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:0.02em;">
        Restablecer contraseña
      </a>
    </div>
    <p style="color:#9AADA6;font-size:12px;text-align:center;margin:20px 0 0;">
      ⏱ Este enlace caduca en <strong>1 hora</strong>
    </p>
  </div>
  <div style="background:#FFF8ED;border:1px solid #F5E6C8;border-radius:10px;padding:12px 16px;">
    <p style="color:#B45309;font-size:13px;margin:0;">
      ⚠️ Si no solicitaste esto, ignora este correo. Tu contraseña no cambiará.
    </p>
  </div>
</div>`,
    });

    return NextResponse.json({ ok: true });
  } finally {
    client.release();
  }
}
