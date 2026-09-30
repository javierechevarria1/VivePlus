import { PoolClient } from "pg";
import { transporter } from "./mailer";

// Avisa al equipo cuando un producto se queda corto de existencias.
//
// Sin esto el stock baja en silencio y un producto puede llegar a cero sin que
// nadie lo note hasta que un comprador se queja de que no puede comprarlo.

export const UMBRAL_STOCK_BAJO = Number(process.env.UMBRAL_STOCK_BAJO ?? 3);

const escapar = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Se llama justo después de descontar. Recibe los productos tocados por el
// pedido y avisa solo de los que hayan cruzado el umbral con esta compra: si
// ya estaban por debajo, el aviso se mandó en su momento y repetirlo en cada
// venta solo consigue que se deje de leer.
export async function avisarStockBajo(
  client: PoolClient,
  productoIds: number[]
): Promise<void> {
  if (productoIds.length === 0) return;

  try {
    const { rows } = await client.query(
      `SELECT id, nombre, stock FROM productos
       WHERE id = ANY($1::int[]) AND segunda_mano = false AND stock <= $2
       ORDER BY stock, nombre`,
      [productoIds, UMBRAL_STOCK_BAJO]
    );
    if (rows.length === 0) return;

    const destino = process.env.ADMIN_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER;
    if (!destino || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`📦 SIMULACIÓN: stock bajo — ${rows.map(r => `${r.nombre} (${r.stock})`).join(", ")}`);
      return;
    }

    const agotados = rows.filter(r => Number(r.stock) <= 0);
    const base = (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");

    const filas = rows.map(r => {
      const sinStock = Number(r.stock) <= 0;
      return `
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid #EDE8DF;font-size:15px;color:#13211A;">${escapar(r.nombre)}</td>
        <td style="padding:9px 0;border-bottom:1px solid #EDE8DF;font-size:15px;text-align:right;font-weight:700;color:${sinStock ? "#A32C3F" : "#96601C"};">
          ${sinStock ? "Agotado" : `${r.stock} ud.`}
        </td>
      </tr>`;
    }).join("");

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Vive+" <noreply@viveplus.com>',
      to: destino,
      subject: agotados.length > 0
        ? `Producto agotado: ${agotados[0].nombre}${agotados.length > 1 ? ` y ${agotados.length - 1} más` : ""}`
        : `Quedan pocas unidades de ${rows[0].nombre}`,
      html: `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F7F5F0;margin:0;padding:40px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" style="width:100%;max-width:520px;background:#FFFFFF;border-radius:22px;overflow:hidden;box-shadow:0 8px 32px rgba(19,33,26,0.10);">
      <tr>
        <td style="background:${agotados.length > 0 ? "#A32C3F" : "#96601C"};padding:30px 28px;text-align:center;">
          <h1 style="margin:0;color:#FFFFFF;font-size:23px;font-weight:700;">
            ${agotados.length > 0 ? "Hay productos agotados" : "Quedan pocas unidades"}
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:26px 28px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${filas}</table>
        </td>
      </tr>
      <tr>
        <td style="padding:22px 28px 0;">
          <p style="margin:0;font-size:14px;color:#3C4A43;line-height:1.65;">
            ${agotados.length > 0
              ? "Los agotados siguen en el catálogo pero no se pueden comprar."
              : `Aviso al bajar de ${UMBRAL_STOCK_BAJO} unidades.`}
          </p>
        </td>
      </tr>
      ${base ? `
      <tr>
        <td style="padding:22px 28px 0;text-align:center;">
          <a href="${base}/admin-marketplace" style="display:inline-block;background:#1A5245;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:15px;font-weight:700;">
            Reponer existencias
          </a>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:26px 28px 30px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9AA69F;">© ${new Date().getFullYear()} Vive+</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>`,
    });
  } catch (err) {
    console.error("❌ Error avisando de stock bajo:", err);
  }
}
