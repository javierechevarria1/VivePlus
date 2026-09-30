import { PoolClient } from "pg";
import { transporter } from "./mailer";

// Aviso al administrador de que ha entrado un pedido de la tienda.
//
// Sin esto una venta solo existe en la base de datos: no hay panel que la
// muestre en tiempo real ni nadie se entera de que hay algo que preparar.
// Es el equivalente al correo que ya recibe el vendedor en segunda mano.

const escapar = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type LineaPedido = { nombre: string; cantidad: number; importe: number };

export function plantillaPedidoNuevo(params: {
  ordenId: number;
  comprador: string;
  email: string | null;
  direccion: string | null;
  lineas: LineaPedido[];
  total: number;
  urlPanel: string | null;
}) {
  const filas = params.lineas.map(l => `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid #EDE8DF;font-size:15px;color:#13211A;">
        ${escapar(l.nombre)} <span style="color:#9AA69F;">× ${l.cantidad}</span>
      </td>
      <td style="padding:9px 0;border-bottom:1px solid #EDE8DF;font-size:15px;color:#13211A;text-align:right;white-space:nowrap;">
        ${l.importe.toFixed(2)} €
      </td>
    </tr>`).join("");

  return `
<div style="display:none;font-size:1px;color:#F7F5F0;max-height:0;overflow:hidden;">Pedido #${params.ordenId} · ${params.total.toFixed(2)} €</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F7F5F0;margin:0;padding:40px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%;max-width:560px;background:#FFFFFF;border-radius:22px;overflow:hidden;box-shadow:0 8px 32px rgba(19,33,26,0.10);">

      <tr>
        <td style="background:linear-gradient(135deg,#1A5245 0%,#2A7A6A 100%);padding:34px 28px;text-align:center;">
          <h1 style="margin:0 0 6px;color:#FFFFFF;font-size:25px;font-weight:700;">Nuevo pedido</h1>
          <p style="margin:0;color:rgba(255,255,255,0.82);font-size:15px;">Pedido #${params.ordenId} · ${params.total.toFixed(2)} €</p>
        </td>
      </tr>

      <tr>
        <td style="padding:26px 28px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${filas}
            <tr>
              <td style="padding:12px 0 0;font-size:17px;font-weight:700;color:#13211A;">Total</td>
              <td style="padding:12px 0 0;font-size:19px;font-weight:800;color:#1A5245;text-align:right;">${params.total.toFixed(2)} €</td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding:24px 28px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F7F5F0;border-radius:14px;">
            <tr><td style="padding:16px 20px;font-size:15px;color:#3C4A43;line-height:1.7;">
              <strong style="color:#13211A;">Enviar a</strong><br>
              ${escapar(params.comprador)}${params.email ? ` · ${escapar(params.email)}` : ""}<br>
              ${params.direccion ? escapar(params.direccion) : "<em>sin dirección indicada</em>"}
            </td></tr>
          </table>
        </td>
      </tr>

      ${params.urlPanel ? `
      <tr>
        <td style="padding:24px 28px 0;text-align:center;">
          <a href="${escapar(params.urlPanel)}" style="display:inline-block;background:#1A5245;color:#FFFFFF;text-decoration:none;padding:13px 26px;border-radius:10px;font-size:15px;font-weight:700;">
            Ver el pedido
          </a>
        </td>
      </tr>` : ""}

      <tr>
        <td style="padding:26px 28px 32px;text-align:center;">
          <p style="margin:0;font-size:13px;color:#9AA69F;">© ${new Date().getFullYear()} Vive+</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>`;
}

// Se llama después de confirmar el cobro. Nunca lanza: un fallo al avisar no
// puede tumbar una compra que ya se ha cobrado.
export async function avisarPedidoNuevo(client: PoolClient, ordenId: number): Promise<void> {
  try {
    const { rows } = await client.query(
      `SELECT o.precio_total, o.direccion_envio,
              COALESCE(u.username, 'Cliente') AS comprador, u.email
       FROM orden o
       LEFT JOIN usuarios u ON u.id = o.usr_comprador_id
       WHERE o.id = $1`,
      [ordenId]
    );
    if (rows.length === 0) return;
    const orden = rows[0];

    // Solo interesan los productos de la tienda: los de segunda mano ya avisan
    // a su propio vendedor y no hay nada que preparar aquí.
    const { rows: lineas } = await client.query(
      `SELECT COALESCE(p.nombre, 'Producto') AS nombre, oi.cantidad, oi.precio_items
       FROM orden_item oi
       LEFT JOIN productos p ON p.id = oi.producto_id
       WHERE oi.orden_id = $1 AND COALESCE(p.segunda_mano, false) = false`,
      [ordenId]
    );
    if (lineas.length === 0) return;

    const destino = process.env.ADMIN_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER;
    if (!destino || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`📧 SIMULACIÓN: aviso de pedido #${ordenId} (${Number(orden.precio_total).toFixed(2)} €) — sin SMTP configurado`);
      return;
    }

    const base = (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Vive+" <noreply@viveplus.com>',
      to: destino,
      subject: `Nuevo pedido #${ordenId} — ${Number(orden.precio_total).toFixed(2)} €`,
      html: plantillaPedidoNuevo({
        ordenId,
        comprador: orden.comprador,
        email: orden.email,
        direccion: orden.direccion_envio,
        lineas: lineas.map(l => ({
          nombre: l.nombre,
          cantidad: Number(l.cantidad),
          importe: Number(l.precio_items),
        })),
        total: Number(orden.precio_total),
        urlPanel: base ? `${base}/admin-pedidos` : null,
      }),
    });
  } catch (err) {
    console.error(`❌ Error avisando del pedido ${ordenId}:`, err);
  }
}
