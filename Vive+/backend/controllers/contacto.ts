import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const { name, email, phone, subject, message } = await req.json();

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from:    `"Relatia 65 Web" <${process.env.SMTP_USER}>`,
    to:      "lopezhector1505@gmail.com",
    replyTo: email,
    subject: `📩 ${subject} — ${name}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #E0EDE9;border-radius:14px;overflow:hidden;">

        <!-- Header -->
        <div style="background:#1A5245;padding:28px 32px;">
          <h1 style="margin:0;color:white;font-size:20px;font-weight:600;">${subject}</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.65);font-size:13px;">Relatia 65 — Formulario web</p>
        </div>

        <!-- Body -->
        <div style="padding:28px 32px;background:white;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #F0EDE6;width:120px;">
                <span style="font-size:12px;font-weight:700;color:#9AADA6;text-transform:uppercase;letter-spacing:0.08em;">Nombre</span>
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #F0EDE6;">
                <span style="font-size:15px;color:#13211A;font-weight:500;">${name}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #F0EDE6;">
                <span style="font-size:12px;font-weight:700;color:#9AADA6;text-transform:uppercase;letter-spacing:0.08em;">Email</span>
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #F0EDE6;">
                <a href="mailto:${email}" style="font-size:15px;color:#2A7A6A;text-decoration:none;">${email}</a>
              </td>
            </tr>
            ${phone ? `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #F0EDE6;">
                <span style="font-size:12px;font-weight:700;color:#9AADA6;text-transform:uppercase;letter-spacing:0.08em;">Teléfono</span>
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #F0EDE6;">
                <a href="tel:${phone}" style="font-size:15px;color:#2A7A6A;text-decoration:none;">${phone}</a>
              </td>
            </tr>` : ""}
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #F0EDE6;">
                <span style="font-size:12px;font-weight:700;color:#9AADA6;text-transform:uppercase;letter-spacing:0.08em;">Asunto</span>
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #F0EDE6;">
                <span style="font-size:15px;color:#13211A;font-weight:500;">${subject}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 0 0;" colspan="2">
                <span style="font-size:12px;font-weight:700;color:#9AADA6;text-transform:uppercase;letter-spacing:0.08em;">Mensaje</span>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding:10px 0 0;">
                <div style="background:#F5F2EC;border-radius:10px;padding:16px 18px;font-size:15px;color:#3A5040;line-height:1.75;white-space:pre-wrap;">${message}</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Footer -->
        <div style="background:#F9F7F3;padding:16px 32px;border-top:1px solid #EEE9E0;">
          <p style="margin:0;font-size:12px;color:#9AADA6;">
            Enviado el ${new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            a las ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} —
            <a href="https://relatie65.es" style="color:#2A7A6A;text-decoration:none;">relatie65.es</a>
          </p>
        </div>

      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}