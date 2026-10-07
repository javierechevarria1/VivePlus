import { PoolClient } from "pg";
import Stripe from "stripe";
import { pusher } from "./pusher";
import { transporter } from "./mailer";
import { plantillaVentaSegundaMano, prepararImagenVenta } from "./email-venta-segunda-mano";
import { confirmarCompraSegundaMano } from "./email-segunda-mano-ciclo";
import {
  DIAS_LIMITE_ENVIO,
  TAMANO_POR_DEFECTO,
  desglosarVenta,
  esTamanoValido,
  fechaLimite,
  tarifaEnvio,
  type TamanoPaquete,
} from "./tarifas-segunda-mano";
import {
  crearEtiqueta,
  partirDireccionComprador,
  sendcloudConfigurado,
  type EtiquetaCreada,
} from "./sendcloud";

export type DatosCobroVenta = {
  compradorId?: number | null;
  ordenId?: number | null;
  paymentIntent?: string | null;
  chargeId?: string | null;
  transferGroup?: string | null;
  direccionEnvio?: string | null;
  // Envío que se le cobró a este producto en concreto: es 0 cuando va
  // agrupado con otro artículo del mismo vendedor, que es quien lo paga.
  importeEnvio?: number | null;
  tamanoPaquete?: string | null;
};

// El charge es lo que hace falta para liberar el dinero más tarde con
// source_transaction, y la sesión de checkout solo trae el PaymentIntent.
export async function datosCobroDesdeSesion(
  session: Stripe.Checkout.Session,
  stripe?: Stripe
): Promise<{
  paymentIntent: string | null;
  chargeId: string | null;
  transferGroup: string | null;
  envios: Record<string, number>;
  tamanos: Record<string, string>;
}> {
  const paymentIntent = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;

  let chargeId: string | null = null;
  if (paymentIntent && stripe) {
    try {
      const pi = await stripe.paymentIntents.retrieve(paymentIntent);
      chargeId = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id ?? null;
    } catch (err) {
      console.error("[segunda-mano] No se pudo recuperar el charge del pago:", err);
    }
  }

  let envios: Record<string, number> = {};
  if (session.metadata?.sm_envios) {
    try {
      envios = JSON.parse(session.metadata.sm_envios);
    } catch {
      // Metadata corrupta: el post-venta cae a la tarifa por defecto.
    }
  }

  let tamanos: Record<string, string> = {};
  if (session.metadata?.sm_tamanos) {
    try {
      tamanos = JSON.parse(session.metadata.sm_tamanos);
    } catch {
      // Igual que arriba: se guarda el tramo por defecto.
    }
  }

  return {
    paymentIntent,
    chargeId,
    transferGroup: session.metadata?.transfer_group ?? null,
    envios,
    tamanos,
  };
}

// Compra el transporte y guarda la etiqueta en la venta. Devuelve null si no
// se pudo, dejando anotado el motivo: esa venta se gestiona a mano y el
// vendedor ve el formulario de seguimiento en su panel.
async function generarEtiquetaVenta(
  client: PoolClient,
  params: {
    ventaId: number;
    ordenId?: number | null;
    tamano: TamanoPaquete;
    nombreProducto: string;
    direccionComprador: string | null;
    vendedor: { username: string; email: string | null; direccion: string | null; cp: string | null; ciudad: string | null; telefono: string | null };
  }
): Promise<EtiquetaCreada | null> {
  const anotarFallo = async (motivo: string) => {
    console.warn(`[Sendcloud] Venta ${params.ventaId} sin etiqueta: ${motivo}`);
    await client.query(
      `UPDATE ventas_segunda_mano SET motivo_sin_etiqueta = $1 WHERE id = $2`,
      [motivo, params.ventaId]
    ).catch(() => {});
    return null;
  };

  if (!sendcloudConfigurado()) return anotarFallo("Sendcloud no configurado");

  const destino = partirDireccionComprador(params.direccionComprador);
  if (!destino) return anotarFallo("No se pudo interpretar la dirección del comprador");

  const { direccion, cp, ciudad, telefono, email: emailVendedor, username } = params.vendedor;
  if (!direccion || !cp || !ciudad) {
    return anotarFallo("El vendedor no tiene dirección de recogida completa");
  }

  const resultado = await crearEtiqueta({
    referencia: `venta-${params.ventaId}`,
    tamano: params.tamano,
    destino,
    origen: { nombre: username, direccion, cp, ciudad, telefono, email: emailVendedor },
    descripcion: params.nombreProducto,
  });

  if (!resultado.ok) return anotarFallo(resultado.motivo);

  const d = resultado.datos;
  await client.query(
    `UPDATE ventas_segunda_mano
     SET sendcloud_id = $1, etiqueta_url = $2, seguimiento = COALESCE($3, seguimiento),
         seguimiento_url = $4, transportista = COALESCE($5, transportista), actualizado_en = NOW()
     WHERE id = $6`,
    [d.sendcloudId, d.etiquetaUrl, d.seguimiento, d.seguimientoUrl, d.transportista, params.ventaId]
  );

  // El mismo envío se copia a la orden. Es redundante, pero así mirando `orden`
  // se ve por dónde va cualquier paquete sin tener que saber antes si lo vendía
  // la tienda o un particular.
  if (params.ordenId) {
    await client.query(
      `UPDATE orden
       SET sendcloud_id = $1, etiqueta_url = $2, seguimiento = $3,
           seguimiento_url = $4, transportista = $5
       WHERE id = $6`,
      [d.sendcloudId, d.etiquetaUrl, d.seguimiento, d.seguimientoUrl, d.transportista, params.ordenId]
    );
  }

  return d;
}

export async function procesarSegundaManoVendida(
  client: PoolClient,
  productoId: number,
  stripe?: Stripe,
  cobro: DatosCobroVenta = {}
) {
  // El producto ya no se borra: la venta tiene que seguir viva hasta que se
  // libere el dinero. El cambio de estado hace ahora de candado atómico —
  // si dos llamadas concurrentes (webhook + redirect de éxito) procesan la
  // misma venta, solo una encuentra el producto 'disponible' y continúa.
  const { rows: prodInfo } = await client.query(
    `UPDATE productos SET estado = 'vendido'
     WHERE id = $1 AND segunda_mano = true AND estado = 'disponible'
     RETURNING id_vendedor, nombre, precio, imagen`,
    [productoId]
  );
  if (prodInfo.length === 0) return;

  const { id_vendedor, nombre, precio, imagen } = prodInfo[0];

  // Sigue fuera de los carritos ajenos: ya no está a la venta.
  await client.query("DELETE FROM carrito_items WHERE producto_id = $1", [productoId]);

  pusher.trigger("segunda-mano", "producto-vendido", { id: productoId }).catch(() => {});

  const precioNum = Number(precio);
  const tamano = esTamanoValido(cobro.tamanoPaquete) ? cobro.tamanoPaquete : TAMANO_POR_DEFECTO;
  const envio = cobro.importeEnvio ?? tarifaEnvio(tamano);
  const desglose = desglosarVenta(precioNum, envio);
  const limiteEnvio = fechaLimite(DIAS_LIMITE_ENVIO);

  // El dinero se queda retenido en la plataforma: aquí no se transfiere nada.
  // El transfer sale de esta fila cuando la venta llega a 'liberado'.
  const { rows: ventaRows } = await client.query(
    `INSERT INTO ventas_segunda_mano (
       producto_id, orden_id, vendedor_id, comprador_id,
       payment_intent, charge_id, transfer_group,
       importe_producto, importe_envio, importe_gestion, importe_total,
       estado, tamano_paquete, direccion_envio, limite_envio
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pagado', $12, $13, $14)
     ON CONFLICT (producto_id) DO NOTHING
     RETURNING id`,
    [
      productoId,
      cobro.ordenId ?? null,
      id_vendedor,
      cobro.compradorId ?? null,
      cobro.paymentIntent ?? null,
      cobro.chargeId ?? null,
      cobro.transferGroup ?? null,
      desglose.producto,
      desglose.envio,
      desglose.gestion,
      desglose.total,
      tamano,
      cobro.direccionEnvio ?? null,
      limiteEnvio,
    ]
  );
  if (ventaRows.length === 0) return;
  const ventaId = ventaRows[0].id;

  // Al comprador: hasta ahora una compra de segunda mano no le confirmaba
  // nada. La confirmación de la tienda deja fuera estos artículos a propósito
  // —tienen otro ciclo y otra garantía— así que necesitan la suya.
  await confirmarCompraSegundaMano(client, ventaId);

  const vendedorQuery = await client.query(
    `SELECT email, username, direccion, cp, ciudad, telefono FROM usuarios WHERE id = $1`,
    [id_vendedor]
  );
  if (vendedorQuery.rows.length === 0) return;

  const { email, username } = vendedorQuery.rows[0];

  // La plataforma compra el transporte y le manda la etiqueta ya pagada: el
  // vendedor solo imprime y deja el paquete. Si no hay credenciales o el
  // transportista falla, la venta sigue adelante por el camino manual —
  // nunca se deja una compra a medias por un problema de logística.
  const etiqueta = await generarEtiquetaVenta(client, {
    ventaId,
    ordenId: cobro.ordenId ?? null,
    tamano,
    nombreProducto: nombre,
    direccionComprador: cobro.direccionEnvio ?? null,
    vendedor: { ...vendedorQuery.rows[0], username },
  });

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`📧 SIMULACIÓN: email a ${email} — producto "${nombre}" vendido, envío antes del ${limiteEnvio.toLocaleDateString("es-ES")}.`);
    return;
  }

  const imagenEmail = prepararImagenVenta(imagen);

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Vive+" <noreply@viveplus.com>',
      to: email,
      subject: `¡Tu producto "${nombre}" se ha vendido! Prepara el envío`,
      html: plantillaVentaSegundaMano({
        username,
        nombre,
        precio: precioNum,
        imagenSrc: imagenEmail.src,
        direccionEnvio: cobro.direccionEnvio ?? null,
        limiteEnvio,
        // Al correo va la URL pública del sitio, no la de Sendcloud: esa
        // necesita nuestras credenciales para descargarse.
        etiquetaUrl: etiqueta
          ? `${(process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "")}/api/etiqueta-envio?venta_id=${ventaId}`
          : null,
      }),
      ...(imagenEmail.adjunto ? { attachments: [imagenEmail.adjunto] } : {}),
    });
  } catch (err) {
    console.error(`❌ Error enviando email de venta a ${email}:`, err);
  }
}
