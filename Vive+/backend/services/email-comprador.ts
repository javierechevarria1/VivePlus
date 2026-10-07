import { PoolClient } from "pg";
import { transporter } from "./mailer";

// Correos al comprador de un pedido de la tienda: confirmación al pagar y
// aviso cuando el paquete sale. Hasta ahora solo se avisaba al equipo y el
// comprador no recibía nada, ni siquiera el seguimiento.
//
// Ninguna de estas funciones lanza: un fallo al avisar no puede tumbar una
// compra ya cobrada ni impedir que un pedido avance de estado.

const escapar = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const REMITENTE = () => process.env.SMTP_FROM || '"Vive+" <noreply@viveplus.com>';

function hayCorreo(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

type Linea = { nombre: string; cantidad: number; importe: number };

function plantilla(params: {
  titulo: string;
  subtitulo: string;
  saludo: string;
  cuerpo: string;
  lineas?: Linea[];
  total?: number;
  pie?: string;
  boton?: { texto: string; url: string } | null;
}) {
  const filas = (params.lineas ?? []).map(l => `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid #EDE8DF;font-size:15px;color:#13211A;">
        ${escapar(l.nombre)} <span style="color:#9AA69F;">× ${l.cantidad}</span>
      </td>
      <td style="padding:9px 0;border-bottom:1px solid #EDE8DF;font-size:15px;color:#13211A;text-align:right;white-space:nowrap;">
        ${l.importe.toFixed(2)} €
      </td>
    </tr>`).join("");

  return `
<div style="display:none;font-size:1px;color:#F7F5F0;max-height:0;overflow:hidden;">${escapar(params.subtitulo)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F7F5F0;margin:0;padding:40px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%;max-width:560px;background:#FFFFFF;border-radius:22px;overflow:hidden;box-shadow:0 8px 32px rgba(19,33,26,0.10);">

      <tr>
        <td style="background:linear-gradient(135deg,#1A5245 0%,#2A7A6A 100%);padding:36px 28px;text-align:center;">
          <h1 style="margin:0 0 6px;color:#FFFFFF;font-size:26px;font-weight:700;letter-spacing:-0.3px;">${escapar(params.titulo)}</h1>
          <p style="margin:0;color:rgba(255,255,255,0.82);font-size:15px;">${escapar(params.subtitulo)}</p>
        </td>
      </tr>

      <tr>
        <td style="padding:28px 28px 0;">
          <p style="margin:0 0 14px;font-size:16px;color:#13211A;">${escapar(params.saludo)}</p>
          <p style="margin:0;font-size:15px;color:#3C4A43;line-height:1.65;">${params.cuerpo}</p>
        </td>
      </tr>

      ${filas ? `
      <tr>
        <td style="padding:24px 28px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${filas}
            ${params.total != null ? `
            <tr>
              <td style="padding:12px 0 0;font-size:17px;font-weight:700;color:#13211A;">Total</td>
              <td style="padding:12px 0 0;font-size:19px;font-weight:800;color:#1A5245;text-align:right;">${params.total.toFixed(2)} €</td>
            </tr>` : ""}
          </table>
        </td>
      </tr>` : ""}

      ${params.boton ? `
      <tr>
        <td style="padding:26px 28px 0;text-align:center;">
          <a href="${escapar(params.boton.url)}" style="display:inline-block;background:#1A5245;color:#FFFFFF;text-decoration:none;padding:13px 28px;border-radius:10px;font-size:15px;font-weight:700;">
            ${escapar(params.boton.texto)}
          </a>
        </td>
      </tr>` : ""}

      ${params.pie ? `
      <tr>
        <td style="padding:24px 28px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F7F5F0;border-radius:14px;">
            <tr><td style="padding:16px 20px;font-size:14px;color:#3C4A43;line-height:1.65;">${params.pie}</td></tr>
          </table>
        </td>
      </tr>` : ""}

      <tr>
        <td style="padding:28px 28px 32px;text-align:center;border-top:1px solid #EDE8DF;margin-top:20px;">
          <p style="margin:0;font-size:12px;color:#9AA69F;line-height:1.6;">© ${new Date().getFullYear()} Vive+ · Cuidando a quienes más importan</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>`;
}

const baseUrl = () =>
  (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");

// Al confirmarse el pago. Le dice qué ha comprado y qué pasa ahora.
export async function confirmarCompraAlComprador(client: PoolClient, ordenId: number): Promise<void> {
  try {
    const { rows } = await client.query(
      `SELECT o.precio_total, o.direccion_envio,
              COALESCE(u.username, 'Hola') AS nombre, u.email
       FROM orden o LEFT JOIN usuarios u ON u.id = o.usr_comprador_id
       WHERE o.id = $1`,
      [ordenId]
    );
    if (rows.length === 0 || !rows[0].email) return;
    const orden = rows[0];

    const { rows: lineas } = await client.query(
      `SELECT COALESCE(p.nombre, 'Producto') AS nombre, oi.cantidad, oi.precio_items
       FROM orden_item oi LEFT JOIN productos p ON p.id = oi.producto_id
       WHERE oi.orden_id = $1 AND COALESCE(p.segunda_mano, false) = false`,
      [ordenId]
    );
    if (lineas.length === 0) return;

    if (!hayCorreo()) {
      console.log(`📧 SIMULACIÓN: confirmación de compra del pedido #${ordenId} a ${orden.email}`);
      return;
    }

    const url = baseUrl();
    await transporter.sendMail({
      from: REMITENTE(),
      to: orden.email,
      subject: `Hemos recibido tu pedido #${ordenId}`,
      html: plantilla({
        titulo: "Pedido confirmado",
        subtitulo: `Pedido #${ordenId}`,
        saludo: `Hola ${orden.nombre},`,
        cuerpo: "Gracias por tu compra. Ya estamos preparando tu pedido y te avisaremos en cuanto salga hacia tu casa.",
        lineas: lineas.map(l => ({ nombre: l.nombre, cantidad: Number(l.cantidad), importe: Number(l.precio_items) })),
        total: Number(orden.precio_total),
        pie: orden.direccion_envio
          ? `<strong style="color:#13211A;">Lo enviaremos a</strong><br>${escapar(orden.direccion_envio)}`
          : undefined,
        boton: url ? { texto: "Ver mi pedido", url: `${url}/mis-pedidos` } : null,
      }),
    });
  } catch (err) {
    console.error(`❌ Error confirmando la compra ${ordenId} al comprador:`, err);
  }
}

// Cuando el pedido pasa a enviado. Es el correo que más se espera: lleva el
// seguimiento, que hasta ahora el comprador no recibía por ningún sitio.
export async function avisarEnvioAlComprador(client: PoolClient, ordenId: number): Promise<void> {
  try {
    const { rows } = await client.query(
      `SELECT o.seguimiento, o.seguimiento_url, o.transportista, o.direccion_envio,
              COALESCE(u.username, 'Hola') AS nombre, u.email
       FROM orden o LEFT JOIN usuarios u ON u.id = o.usr_comprador_id
       WHERE o.id = $1`,
      [ordenId]
    );
    if (rows.length === 0 || !rows[0].email) return;
    const orden = rows[0];

    if (!hayCorreo()) {
      console.log(`📧 SIMULACIÓN: aviso de envío del pedido #${ordenId} a ${orden.email}`);
      return;
    }

    const url = baseUrl();
    const seguimiento = orden.seguimiento
      ? `<strong style="color:#13211A;">Número de seguimiento</strong><br>` +
        `${escapar(orden.transportista ?? "Transportista")} · ` +
        (orden.seguimiento_url
          ? `<a href="${escapar(orden.seguimiento_url)}" style="color:#1A5245;">${escapar(orden.seguimiento)}</a>`
          : `<span style="letter-spacing:0.03em;">${escapar(orden.seguimiento)}</span>`)
      : undefined;

    await transporter.sendMail({
      from: REMITENTE(),
      to: orden.email,
      subject: `Tu pedido #${ordenId} va en camino`,
      html: plantilla({
        titulo: "Tu pedido va en camino",
        subtitulo: `Pedido #${ordenId}`,
        saludo: `Hola ${orden.nombre},`,
        cuerpo: orden.direccion_envio
          ? `Ya hemos enviado tu pedido a <strong style="color:#13211A;">${escapar(orden.direccion_envio)}</strong>. Suele tardar entre 2 y 4 días laborables.`
          : "Ya hemos enviado tu pedido. Suele tardar entre 2 y 4 días laborables.",
        pie: seguimiento,
        boton: orden.seguimiento_url
          ? { texto: "Seguir mi paquete", url: orden.seguimiento_url }
          : url ? { texto: "Ver mi pedido", url: `${url}/mis-pedidos` } : null,
      }),
    });
  } catch (err) {
    console.error(`❌ Error avisando del envío ${ordenId} al comprador:`, err);
  }
}
