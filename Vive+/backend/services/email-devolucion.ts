import { PoolClient } from "pg";
import { transporter } from "./mailer";

// Correos del ciclo de devolución, en los cuatro momentos en que alguien
// necesita enterarse de algo:
//
//   el comprador la pide      → aviso al equipo
//   el equipo la acepta       → al comprador, con la etiqueta de vuelta
//   el equipo la rechaza      → al comprador, con el motivo
//   el paquete nos llega      → aviso al equipo, que ya puede reembolsar
//   se devuelve el dinero     → al comprador
//
// Hasta ahora no salía ninguno: la solicitud esperaba en el panel a que
// alguien mirase, y el comprador solo veía el desenlace si volvía a entrar.
//
// Igual que el resto de avisos, ninguna de estas funciones lanza: un fallo de
// correo no puede impedir que una devolución avance ni que un reembolso ya
// hecho quede registrado.

const escapar = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const REMITENTE = () => process.env.SMTP_FROM || '"Vive+" <noreply@viveplus.com>';

function hayCorreo(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

const baseUrl = () =>
  (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");

const destinoEquipo = () =>
  process.env.ADMIN_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER;

function plantilla(params: {
  color: string;
  titulo: string;
  subtitulo: string;
  saludo?: string;
  cuerpo: string;
  pasos?: string[];
  pie?: string;
  boton?: { texto: string; url: string } | null;
}) {
  // Los pasos van numerados y con mucho aire: es la parte que el comprador
  // lee con el paquete delante, no sentado.
  const pasos = (params.pasos ?? []).map((p, i) => `
    <tr>
      <td width="30" valign="top" style="padding:7px 0;">
        <div style="width:22px;height:22px;border-radius:11px;background:${params.color};color:#FFFFFF;font-size:12px;font-weight:700;text-align:center;line-height:22px;">${i + 1}</div>
      </td>
      <td style="padding:7px 0 7px 10px;font-size:15px;color:#3C4A43;line-height:1.6;">${p}</td>
    </tr>`).join("");

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
          ${params.saludo ? `<p style="margin:0 0 14px;font-size:16px;color:#13211A;">${escapar(params.saludo)}</p>` : ""}
          <p style="margin:0;font-size:15px;color:#3C4A43;line-height:1.65;">${params.cuerpo}</p>
        </td>
      </tr>

      ${pasos ? `
      <tr>
        <td style="padding:20px 28px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${pasos}</table>
        </td>
      </tr>` : ""}

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

type FilaDevolucion = {
  id: number;
  orden_id: number | null;
  venta_id: number | null;
  tipo: string;
  motivo: string | null;
  respuesta: string | null;
  estado: string;
  importe_solicitado: string | null;
  importe_reembolsado: string | null;
  seguimiento: string | null;
  seguimiento_url: string | null;
  transportista: string | null;
  etiqueta_url: string | null;
  nombre: string;
  email: string | null;
  producto: string | null;
};

async function leerDevolucion(client: PoolClient, id: number): Promise<FilaDevolucion | null> {
  const { rows } = await client.query<FilaDevolucion>(
    `SELECT d.id, d.orden_id, d.venta_id, d.tipo, d.motivo, d.respuesta, d.estado,
            d.importe_solicitado, d.importe_reembolsado,
            d.seguimiento, d.seguimiento_url, d.transportista, d.etiqueta_url,
            COALESCE(u.username, 'Hola') AS nombre, u.email,
            COALESCE(
              (SELECT p.nombre FROM ventas_segunda_mano v
               JOIN productos p ON p.id = v.producto_id WHERE v.id = d.venta_id),
              (SELECT p2.nombre FROM orden_item oi
               JOIN productos p2 ON p2.id = oi.producto_id
               WHERE oi.orden_id = d.orden_id LIMIT 1)
            ) AS producto
     FROM devoluciones d
     LEFT JOIN usuarios u ON u.id = d.usuario_id
     WHERE d.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

const referencia = (d: FilaDevolucion) =>
  d.orden_id ? `pedido #${d.orden_id}` : `venta #${d.venta_id}`;

const euros = (v: string | null) => (v == null ? "" : `${Number(v).toFixed(2)} €`);

// ── Al equipo: alguien ha pedido una devolución ───────────────────────────────

export async function avisarDevolucionSolicitada(client: PoolClient, devolucionId: number): Promise<void> {
  try {
    const d = await leerDevolucion(client, devolucionId);
    if (!d) return;

    const destino = destinoEquipo();
    if (!destino || !hayCorreo()) {
      console.log(`📧 SIMULACIÓN: solicitud de devolución #${devolucionId} del ${referencia(d)}`);
      return;
    }

    const esIncidencia = d.tipo === "incidencia";
    const url = baseUrl();

    await transporter.sendMail({
      from: REMITENTE(),
      to: destino,
      subject: esIncidencia
        ? `Incidencia en la ${referencia(d)} — ${euros(d.importe_solicitado)}`
        : `Devolución solicitada del ${referencia(d)} — ${euros(d.importe_solicitado)}`,
      html: plantilla({
        color: "#B45309",
        titulo: esIncidencia ? "Hay una incidencia" : "Devolución solicitada",
        subtitulo: `${referencia(d).charAt(0).toUpperCase()}${referencia(d).slice(1)} · ${euros(d.importe_solicitado)}`,
        cuerpo: `<strong style="color:#13211A;">${escapar(d.nombre)}</strong> ha solicitado ` +
          (esIncidencia
            ? "resolver una incidencia"
            : "la devolución") +
          ` de ${escapar(d.producto ?? "un artículo")}.`,
        pie: d.motivo
          ? `<strong style="color:#13211A;">Lo que cuenta</strong><br>${escapar(d.motivo)}`
          : "No ha dado motivo. En una devolución por desistimiento no está obligado a darlo.",
        boton: url ? { texto: "Resolver en el panel", url: `${url}/admin-pedidos` } : null,
      }),
    });
  } catch (err) {
    console.error(`❌ Error avisando de la devolución ${devolucionId}:`, err);
  }
}

// ── Al comprador: aceptada, con la etiqueta de vuelta ─────────────────────────

export async function avisarDevolucionAceptada(client: PoolClient, devolucionId: number): Promise<void> {
  try {
    const d = await leerDevolucion(client, devolucionId);
    if (!d?.email) return;

    if (!hayCorreo()) {
      console.log(`📧 SIMULACIÓN: devolución #${devolucionId} aceptada, aviso a ${d.email}`);
      return;
    }

    const url = baseUrl();
    const hayEtiqueta = Boolean(d.etiqueta_url);

    // Con etiqueta el comprador no tiene que hacer nada más que empaquetar.
    // Sin ella —Sendcloud caído o sin configurar— no se le puede pedir que
    // adivine: se le dice que le escribimos nosotros.
    const pasos = hayEtiqueta
      ? [
          "Mete el artículo en su caja, con todo lo que venía dentro.",
          "Descarga la etiqueta con el botón de abajo e imprímela.",
          "Pégala encima de la etiqueta anterior, tapándola.",
          "Déjalo en cualquier oficina o punto del transportista. <strong style=\"color:#13211A;\">No pagas nada allí</strong>.",
        ]
      : [
          "Guarda el artículo en su caja, con todo lo que venía dentro.",
          "Espera nuestro correo con las instrucciones para el envío de vuelta.",
        ];

    await transporter.sendMail({
      from: REMITENTE(),
      to: d.email,
      subject: `Tu devolución del ${referencia(d)} está aceptada`,
      html: plantilla({
        color: "#1A5245",
        titulo: "Devolución aceptada",
        subtitulo: `${referencia(d).charAt(0).toUpperCase()}${referencia(d).slice(1)}`,
        saludo: `Hola ${d.nombre},`,
        cuerpo: hayEtiqueta
          ? `Hemos aceptado la devolución de <strong style="color:#13211A;">${escapar(d.producto ?? "tu artículo")}</strong>. ` +
            "Del envío nos encargamos nosotros: solo tienes que preparar el paquete y dejarlo."
          : `Hemos aceptado la devolución de <strong style="color:#13211A;">${escapar(d.producto ?? "tu artículo")}</strong>. ` +
            "Estamos organizando el envío de vuelta y te escribimos en cuanto lo tengamos.",
        pasos,
        // Sin cifra: lo que se devuelve es el precio del producto, no el total
        // del pedido, y la orden solo guarda el total. Prometer un número que
        // luego no cuadra es peor que no darlo.
        pie: `<strong style="color:#13211A;">Cuándo recibes el dinero</strong><br>` +
          "Te devolvemos todo lo que pagaste —el producto y el envío de la compra— menos el coste " +
          "del viaje de vuelta, en cuanto nos llegue el paquete. " +
          "El abono tarda unos días hábiles en aparecer en la misma tarjeta con la que pagaste." +
          (d.seguimiento
            ? `<br><br><strong style="color:#13211A;">Seguimiento</strong><br>${escapar(d.transportista ?? "Transportista")} · ` +
              (d.seguimiento_url
                ? `<a href="${escapar(d.seguimiento_url)}" style="color:#1A5245;">${escapar(d.seguimiento)}</a>`
                : escapar(d.seguimiento))
            : ""),
        boton: hayEtiqueta && url
          ? { texto: "Descargar la etiqueta de vuelta", url: `${url}/api/etiqueta-envio?devolucion_id=${d.id}` }
          : url ? { texto: "Ver mi pedido", url: `${url}/mis-pedidos` } : null,
      }),
    });
  } catch (err) {
    console.error(`❌ Error avisando de la aceptación ${devolucionId}:`, err);
  }
}

// ── Al comprador: rechazada ───────────────────────────────────────────────────

export async function avisarDevolucionRechazada(client: PoolClient, devolucionId: number): Promise<void> {
  try {
    const d = await leerDevolucion(client, devolucionId);
    if (!d?.email) return;

    if (!hayCorreo()) {
      console.log(`📧 SIMULACIÓN: devolución #${devolucionId} rechazada, aviso a ${d.email}`);
      return;
    }

    const url = baseUrl();

    await transporter.sendMail({
      from: REMITENTE(),
      to: d.email,
      subject: `Sobre tu solicitud del ${referencia(d)}`,
      html: plantilla({
        color: "#7A4A4A",
        titulo: "No hemos podido aceptarla",
        subtitulo: `${referencia(d).charAt(0).toUpperCase()}${referencia(d).slice(1)}`,
        saludo: `Hola ${d.nombre},`,
        cuerpo: `Hemos revisado tu solicitud sobre <strong style="color:#13211A;">${escapar(d.producto ?? "tu artículo")}</strong> ` +
          "y esta vez no hemos podido aceptarla.",
        pie: d.respuesta
          ? `<strong style="color:#13211A;">Motivo</strong><br>${escapar(d.respuesta)}`
          : "Si crees que hay algo que no hemos tenido en cuenta, escríbenos y lo revisamos.",
        boton: url ? { texto: "Ver mi pedido", url: `${url}/mis-pedidos` } : null,
      }),
    });
  } catch (err) {
    console.error(`❌ Error avisando del rechazo ${devolucionId}:`, err);
  }
}

// ── Al equipo: el paquete de vuelta ya está aquí ──────────────────────────────

export async function avisarRetornoRecibido(client: PoolClient, devolucionId: number): Promise<void> {
  try {
    const d = await leerDevolucion(client, devolucionId);
    if (!d) return;

    const destino = destinoEquipo();
    if (!destino || !hayCorreo()) {
      console.log(`📧 SIMULACIÓN: ha llegado el paquete de la devolución #${devolucionId}`);
      return;
    }

    const url = baseUrl();

    await transporter.sendMail({
      from: REMITENTE(),
      to: destino,
      subject: `Ha llegado la devolución del ${referencia(d)} — queda reembolsar`,
      html: plantilla({
        color: "#0369A1",
        titulo: "El paquete ha vuelto",
        subtitulo: `${referencia(d).charAt(0).toUpperCase()}${referencia(d).slice(1)}`,
        cuerpo: `El transportista ha entregado la devolución de <strong style="color:#13211A;">${escapar(d.producto ?? "un artículo")}</strong> ` +
          `que envió ${escapar(d.nombre)}.`,
        pasos: [
          "Comprueba que llega completo y en condiciones.",
          `Reembolsa desde el panel. En blanco devuelve los ${euros(d.importe_solicitado)} que pagó menos el envío de vuelta; si el fallo fue nuestro, escribe el total y no se le descuenta nada.`,
          "La unidad vuelve al stock sola al reembolsar.",
        ],
        boton: url ? { texto: "Abrir el panel", url: `${url}/admin-pedidos` } : null,
      }),
    });
  } catch (err) {
    console.error(`❌ Error avisando del retorno ${devolucionId}:`, err);
  }
}

// ── A los dos: el plazo de vuelta ha vencido ──────────────────────────────────

export async function avisarRetornoCaducado(client: PoolClient, devolucionId: number): Promise<void> {
  try {
    const d = await leerDevolucion(client, devolucionId);
    if (!d) return;

    const destino = destinoEquipo();
    if (!hayCorreo()) {
      console.log(`📧 SIMULACIÓN: caducó el plazo de vuelta de la devolución #${devolucionId}`);
      return;
    }

    const url = baseUrl();

    // Al comprador, porque es quien puede arreglarlo: la devolución se cierra,
    // pero puede volver a pedirla si todavía está en plazo de desistimiento.
    if (d.email) {
      await transporter.sendMail({
        from: REMITENTE(),
        to: d.email,
        subject: `Hemos cerrado tu devolución del ${referencia(d)}`,
        html: plantilla({
          color: "#96601C",
          titulo: "Se ha pasado el plazo",
          subtitulo: `${referencia(d).charAt(0).toUpperCase()}${referencia(d).slice(1)}`,
          saludo: `Hola ${d.nombre},`,
          cuerpo: `Aceptamos tu devolución de <strong style="color:#13211A;">${escapar(d.producto ?? "tu artículo")}</strong> ` +
            "y te mandamos una etiqueta de vuelta, pero el paquete no ha llegado a salir. " +
            "Cerramos la solicitud para no dejarla abierta indefinidamente.",
          pie: "<strong style=\"color:#13211A;\">Si todavía quieres devolverlo</strong><br>" +
            "Puedes volver a solicitarlo desde tu pedido, siempre que sigas dentro de los 14 días. " +
            "Te mandaremos una etiqueta nueva.",
          boton: url ? { texto: "Ver mi pedido", url: `${url}/mis-pedidos` } : null,
        }),
      });
    }

    // Al equipo, porque hay una etiqueta comprada que ya no se va a usar.
    if (destino) {
      await transporter.sendMail({
        from: REMITENTE(),
        to: destino,
        subject: `Devolución caducada del ${referencia(d)} — etiqueta sin usar`,
        html: plantilla({
          color: "#96601C",
          titulo: "Devolución caducada",
          subtitulo: `${referencia(d).charAt(0).toUpperCase()}${referencia(d).slice(1)}`,
          cuerpo: `${escapar(d.nombre)} no envió el paquete dentro del plazo. La devolución queda cerrada ` +
            "sin reembolso y el pedido sigue como estaba." +
            (d.seguimiento
              ? ` La etiqueta <strong style="color:#13211A;">${escapar(d.seguimiento)}</strong> se ha comprado y no se ha usado: si el transportista la cobra, conviene reclamarla.`
              : ""),
          boton: url ? { texto: "Abrir el panel", url: `${url}/admin-pedidos` } : null,
        }),
      });
    }
  } catch (err) {
    console.error(`❌ Error avisando de la caducidad ${devolucionId}:`, err);
  }
}

// ── Al comprador: dinero devuelto ─────────────────────────────────────────────

export async function avisarReembolsoHecho(client: PoolClient, devolucionId: number): Promise<void> {
  try {
    const d = await leerDevolucion(client, devolucionId);
    if (!d?.email) return;

    if (!hayCorreo()) {
      console.log(`📧 SIMULACIÓN: reembolso de la devolución #${devolucionId} a ${d.email}`);
      return;
    }

    const url = baseUrl();

    await transporter.sendMail({
      from: REMITENTE(),
      to: d.email,
      subject: `Te hemos devuelto ${euros(d.importe_reembolsado ?? d.importe_solicitado)}`,
      html: plantilla({
        color: "#1F6F4A",
        titulo: "Dinero devuelto",
        subtitulo: `${euros(d.importe_reembolsado ?? d.importe_solicitado)} · ${referencia(d)}`,
        saludo: `Hola ${d.nombre},`,
        cuerpo: `Ya está hecho. Te hemos devuelto <strong style="color:#13211A;">${euros(d.importe_reembolsado ?? d.importe_solicitado)}</strong> ` +
          "a la misma tarjeta con la que pagaste.",
        pie: "<strong style=\"color:#13211A;\">Tarda unos días en aparecer</strong><br>" +
          "El abono depende de tu banco: lo normal es entre tres y cinco días hábiles. Si pasada una semana no lo ves, escríbenos." +
          (d.respuesta ? `<br><br>${escapar(d.respuesta)}` : ""),
        boton: url ? { texto: "Ver mis pedidos", url: `${url}/mis-pedidos` } : null,
      }),
    });
  } catch (err) {
    console.error(`❌ Error avisando del reembolso ${devolucionId}:`, err);
  }
}
