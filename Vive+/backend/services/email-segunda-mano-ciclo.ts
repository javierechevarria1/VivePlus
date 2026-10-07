import { PoolClient } from "pg";
import { transporter } from "./mailer";
import { DIAS_TRAS_ENTREGA } from "./tarifas-segunda-mano";

// Los correos del ciclo normal de una venta entre particulares.
//
// Hasta ahora solo salía uno: el aviso al vendedor de que le habían comprado.
// El comprador no recibía nada —ni confirmación, ni aviso de que el paquete
// salía, ni de que ya podía confirmar— y el vendedor no se enteraba de que le
// habían pagado ni de que había una incidencia contra su venta. Todo eso solo
// se veía entrando a mirar.
//
// Ninguna de estas funciones lanza: un fallo de correo no puede impedir que
// una venta avance ni que un pago ya hecho quede registrado.

const escapar = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const REMITENTE = () => process.env.SMTP_FROM || '"Vive+" <noreply@viveplus.com>';

function hayCorreo(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

const baseUrl = () =>
  (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");

const euros = (v: unknown) => `${Number(v ?? 0).toFixed(2)} €`;

function plantilla(params: {
  color: string;
  titulo: string;
  subtitulo: string;
  saludo: string;
  cuerpo: string;
  pie?: string;
  boton?: { texto: string; url: string } | null;
}) {
  return `
<div style="display:none;font-size:1px;color:#F7F5F0;max-height:0;overflow:hidden;">${escapar(params.subtitulo)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F7F5F0;margin:0;padding:40px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%;max-width:560px;background:#FFFFFF;border-radius:22px;overflow:hidden;box-shadow:0 8px 32px rgba(19,33,26,0.10);">
      <tr>
        <td style="background:${params.color};padding:34px 28px;text-align:center;">
          <h1 style="margin:0 0 6px;color:#FFFFFF;font-size:25px;font-weight:700;letter-spacing:-0.3px;">${escapar(params.titulo)}</h1>
          <p style="margin:0;color:rgba(255,255,255,0.85);font-size:15px;">${escapar(params.subtitulo)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 28px 0;">
          <p style="margin:0 0 14px;font-size:16px;color:#13211A;">${escapar(params.saludo)}</p>
          <p style="margin:0;font-size:15px;color:#3C4A43;line-height:1.65;">${params.cuerpo}</p>
        </td>
      </tr>
      ${params.boton ? `
      <tr>
        <td style="padding:26px 28px 0;text-align:center;">
          <a href="${escapar(params.boton.url)}" style="display:inline-block;background:${params.color};color:#FFFFFF;text-decoration:none;padding:13px 28px;border-radius:10px;font-size:15px;font-weight:700;">
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
        <td style="padding:28px 28px 32px;text-align:center;border-top:1px solid #EDE8DF;">
          <p style="margin:0;font-size:12px;color:#9AA69F;line-height:1.6;">© ${new Date().getFullYear()} Vive+ · Cuidando a quienes más importan</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>`;
}

type FilaVenta = {
  id: number;
  estado: string;
  importe_producto: string | null;
  importe_total: string | null;
  transportista: string | null;
  seguimiento: string | null;
  seguimiento_url: string | null;
  producto: string | null;
  comprador: string;
  comprador_email: string | null;
  vendedor: string;
  vendedor_email: string | null;
};

async function leerVenta(client: PoolClient, ventaId: number): Promise<FilaVenta | null> {
  const { rows } = await client.query<FilaVenta>(
    `SELECT v.id, v.estado, v.importe_producto, v.importe_total,
            v.transportista, v.seguimiento, v.seguimiento_url,
            p.nombre AS producto,
            COALESCE(c.username, 'Hola') AS comprador, c.email AS comprador_email,
            COALESCE(ve.username, 'Hola') AS vendedor,  ve.email AS vendedor_email
     FROM ventas_segunda_mano v
     LEFT JOIN productos p ON p.id = v.producto_id
     LEFT JOIN usuarios c  ON c.id = v.comprador_id
     LEFT JOIN usuarios ve ON ve.id = v.vendedor_id
     WHERE v.id = $1`,
    [ventaId]
  );
  return rows[0] ?? null;
}

// ── Al comprador: la compra está hecha y el dinero está retenido ──────────────

export async function confirmarCompraSegundaMano(client: PoolClient, ventaId: number): Promise<void> {
  try {
    const v = await leerVenta(client, ventaId);
    if (!v?.comprador_email) return;

    if (!hayCorreo()) {
      console.log(`📧 SIMULACIÓN: confirmación de compra de segunda mano #${ventaId} a ${v.comprador_email}`);
      return;
    }

    const url = baseUrl();
    await transporter.sendMail({
      from: REMITENTE(),
      to: v.comprador_email,
      subject: `Has comprado «${v.producto ?? "un artículo"}»`,
      html: plantilla({
        color: "#6D28D9",
        titulo: "Compra confirmada",
        subtitulo: v.producto ?? "Segunda mano",
        saludo: `Hola ${v.comprador},`,
        cuerpo: `Ya es tuyo. Le hemos avisado a <strong style="color:#13211A;">${escapar(v.vendedor)}</strong> para que te lo envíe, ` +
          "y te escribimos otra vez en cuanto el paquete salga.",
        // Es lo que diferencia esto de pagar a un desconocido por Bizum, y
        // conviene que lo lea justo después de pagar.
        pie: `<strong style="color:#13211A;">Tu dinero está a salvo</strong><br>` +
          `Los ${euros(v.importe_total)} que has pagado se quedan retenidos con nosotros. ` +
          "El vendedor no cobra nada hasta que recibas el producto y digas que está bien. " +
          "Si no llega, o llega mal, te lo devolvemos.",
        boton: url ? { texto: "Ver mi compra", url: `${url}/mis-pedidos` } : null,
      }),
    });
  } catch (err) {
    console.error(`❌ Error confirmando la compra de segunda mano ${ventaId}:`, err);
  }
}

// ── Al comprador: el paquete va en camino ─────────────────────────────────────

export async function avisarEnvioSegundaMano(client: PoolClient, ventaId: number): Promise<void> {
  try {
    const v = await leerVenta(client, ventaId);
    if (!v?.comprador_email) return;

    if (!hayCorreo()) {
      console.log(`📧 SIMULACIÓN: aviso de envío de la venta #${ventaId} a ${v.comprador_email}`);
      return;
    }

    const url = baseUrl();
    const seguimiento = v.seguimiento
      ? `<strong style="color:#13211A;">Número de seguimiento</strong><br>` +
        `${escapar(v.transportista ?? "Transportista")} · ` +
        (v.seguimiento_url
          ? `<a href="${escapar(v.seguimiento_url)}" style="color:#6D28D9;">${escapar(v.seguimiento)}</a>`
          : `<span style="letter-spacing:0.03em;">${escapar(v.seguimiento)}</span>`)
      : undefined;

    await transporter.sendMail({
      from: REMITENTE(),
      to: v.comprador_email,
      subject: `«${v.producto ?? "Tu compra"}» va en camino`,
      html: plantilla({
        color: "#6D28D9",
        titulo: "Va en camino",
        subtitulo: v.producto ?? "Segunda mano",
        saludo: `Hola ${v.comprador},`,
        cuerpo: `${escapar(v.vendedor)} ya ha enviado tu paquete. Cuando llegue, entra y confirma que está todo bien: ` +
          "es lo que hace que el vendedor cobre.",
        pie: seguimiento,
        boton: v.seguimiento_url
          ? { texto: "Seguir mi paquete", url: v.seguimiento_url }
          : url ? { texto: "Ver mi compra", url: `${url}/mis-pedidos` } : null,
      }),
    });
  } catch (err) {
    console.error(`❌ Error avisando del envío de la venta ${ventaId}:`, err);
  }
}

// ── Al comprador: ha llegado, toca confirmar ──────────────────────────────────

export async function pedirConfirmacionRecepcion(client: PoolClient, ventaId: number): Promise<void> {
  try {
    const v = await leerVenta(client, ventaId);
    if (!v?.comprador_email) return;

    if (!hayCorreo()) {
      console.log(`📧 SIMULACIÓN: petición de confirmación de la venta #${ventaId} a ${v.comprador_email}`);
      return;
    }

    const url = baseUrl();
    await transporter.sendMail({
      from: REMITENTE(),
      to: v.comprador_email,
      subject: `¿Ha llegado bien «${v.producto ?? "tu compra"}»?`,
      html: plantilla({
        color: "#0F6E62",
        titulo: "Tu paquete ha llegado",
        subtitulo: v.producto ?? "Segunda mano",
        saludo: `Hola ${v.comprador},`,
        cuerpo: "El transportista nos dice que ya lo tienes. Ábrelo con calma y comprueba que es lo que esperabas.",
        pie: `<strong style="color:#13211A;">Si está todo bien, no tienes que hacer nada</strong><br>` +
          `Pasados ${DIAS_TRAS_ENTREGA} días le pagamos al vendedor. Si prefieres, puedes confirmarlo tú y cobra antes. ` +
          "<br><br>Y si algo va mal —está roto, o no es lo que comprabas— dilo desde tu compra con el botón " +
          "«Tengo un problema con esta compra» y lo resolvemos nosotros.",
        boton: url ? { texto: "Ver mi compra", url: `${url}/mis-pedidos` } : null,
      }),
    });
  } catch (err) {
    console.error(`❌ Error pidiendo la confirmación de la venta ${ventaId}:`, err);
  }
}

// ── Al vendedor: ya tiene su dinero ───────────────────────────────────────────

export async function avisarDineroLiberado(client: PoolClient, ventaId: number): Promise<void> {
  try {
    const v = await leerVenta(client, ventaId);
    if (!v?.vendedor_email) return;

    if (!hayCorreo()) {
      console.log(`📧 SIMULACIÓN: dinero liberado de la venta #${ventaId} a ${v.vendedor_email}`);
      return;
    }

    const url = baseUrl();
    await transporter.sendMail({
      from: REMITENTE(),
      to: v.vendedor_email,
      subject: `Te hemos pagado ${euros(v.importe_producto)} por «${v.producto ?? "tu artículo"}»`,
      html: plantilla({
        color: "#0F6E62",
        titulo: "Ya tienes tu dinero",
        subtitulo: `${euros(v.importe_producto)} · ${v.producto ?? "Segunda mano"}`,
        saludo: `Hola ${v.vendedor},`,
        cuerpo: `La venta se ha cerrado y te hemos transferido <strong style="color:#13211A;">${euros(v.importe_producto)}</strong>, ` +
          "el 100 % del precio que pusiste. Sin comisiones por tu parte.",
        pie: "<strong style=\"color:#13211A;\">Cuándo lo verás</strong><br>" +
          "La transferencia va a la cuenta bancaria que diste al configurar los cobros y suele tardar un par de días hábiles.",
        boton: url ? { texto: "Ver mis ventas", url: `${url}/mis-pedidos` } : null,
      }),
    });
  } catch (err) {
    console.error(`❌ Error avisando del pago de la venta ${ventaId}:`, err);
  }
}

// ── Al vendedor: hay una incidencia contra su venta ───────────────────────────

export async function avisarIncidenciaAlVendedor(
  client: PoolClient,
  ventaId: number,
  motivo: string | null
): Promise<void> {
  try {
    const v = await leerVenta(client, ventaId);
    if (!v?.vendedor_email) return;

    if (!hayCorreo()) {
      console.log(`📧 SIMULACIÓN: incidencia de la venta #${ventaId} avisada a ${v.vendedor_email}`);
      return;
    }

    const url = baseUrl();
    await transporter.sendMail({
      from: REMITENTE(),
      to: v.vendedor_email,
      subject: `Hay un problema con tu venta de «${v.producto ?? "un artículo"}»`,
      html: plantilla({
        color: "#A2571B",
        titulo: "Incidencia en tu venta",
        subtitulo: v.producto ?? "Segunda mano",
        saludo: `Hola ${v.vendedor},`,
        cuerpo: `${escapar(v.comprador)} nos ha dicho que algo no ha ido bien con esta compra. ` +
          "Lo estamos revisando nosotros: <strong style=\"color:#13211A;\">no tienes que hacer nada de momento</strong>, " +
          "pero queríamos que lo supieras antes de notar que el pago se retrasa.",
        // Enterarse por el silencio de un ingreso que no llega es la peor
        // forma de enterarse.
        pie: motivo
          ? `<strong style="color:#13211A;">Lo que cuenta el comprador</strong><br>${escapar(motivo)}`
          : "No ha detallado el motivo. Si tienes algo que aportar, escríbenos y lo tenemos en cuenta.",
        boton: url ? { texto: "Ver mis ventas", url: `${url}/mis-pedidos` } : null,
      }),
    });
  } catch (err) {
    console.error(`❌ Error avisando de la incidencia de la venta ${ventaId}:`, err);
  }
}
