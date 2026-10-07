import Stripe from "stripe";
import { pool } from "@/lib/db";

/**
 * Datos de la factura que se consultan sin abrir el JSON de Stripe:
 * a quien pertenece y como descargarla.
 */
export type DatosFactura = {
  usuarioId?: number | null;
  ordenId?: number | null;
  numero?: string | null;
  importe?: number | null;
  hostedInvoiceUrl?: string | null;
  pdfUrl?: string | null;
};

/**
 * Guarda una factura en la base de datos
 * @param paymentIntentId - ID del payment intent de Stripe
 * @param stripeData - Objeto completo del pago devuelto por Stripe
 * @param datos - Vinculo con usuario/pedido y datos del documento emitido
 * @returns El ID de la factura guardada
 */
export async function saveInvoiceToDatabase(
  paymentIntentId: string,
  stripeData: Record<string, any>,
  datos: DatosFactura = {}
): Promise<number> {
  const client = await pool.connect();
  try {
    console.log(`[Invoice] 📝 Guardando factura en BD para payment intent: ${paymentIntentId}`);

    const valores = [
      datos.usuarioId ?? null,
      datos.ordenId ?? null,
      datos.numero ?? null,
      datos.importe ?? null,
      datos.hostedInvoiceUrl ?? null,
      datos.pdfUrl ?? null,
    ];

    // El mismo pago llega por dos caminos: checkout.session.completed trae el
    // payment intent e invoice.paid trae la factura ya numerada. Si el pedido ya
    // tiene fila, se completa esa en vez de crear una segunda.
    if (datos.ordenId) {
      // Sin el payment intent entre los parámetros: aquí no se actualiza esa
      // columna y un parámetro sin usar impide a Postgres inferir su tipo.
      const { rows } = await client.query(
        `UPDATE facturas SET
           stripe_data = CASE WHEN $3::text IS NOT NULL THEN $1::jsonb ELSE stripe_data END,
           usuario_id = COALESCE($2::integer, usuario_id),
           numero = COALESCE($3::text, numero),
           importe = COALESCE($4::numeric, importe),
           hosted_invoice_url = COALESCE($5::text, hosted_invoice_url),
           pdf_url = COALESCE($6::text, pdf_url),
           updated_at = CURRENT_TIMESTAMP
         WHERE orden_id = $7::integer
         RETURNING id`,
        [
          JSON.stringify(stripeData),
          datos.usuarioId ?? null,
          datos.numero ?? null,
          datos.importe ?? null,
          datos.hostedInvoiceUrl ?? null,
          datos.pdfUrl ?? null,
          datos.ordenId,
        ]
      );
      if (rows.length > 0) {
        console.log(`✅ [Invoice] Factura del pedido ${datos.ordenId} actualizada (ID: ${rows[0].id})`);
        return rows[0].id;
      }
    }

    // Guardar toda la información de Stripe en stripe_data. El numero solo existe
    // cuando Stripe ha finalizado la factura, asi que un pago sin numerar nunca
    // pisa el JSON de una factura ya emitida.
    const result = await client.query(
      `INSERT INTO facturas (stripe_payment_id, stripe_data, usuario_id, orden_id, numero, importe, hosted_invoice_url, pdf_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (stripe_payment_id) DO UPDATE SET
         stripe_data = CASE WHEN EXCLUDED.numero IS NOT NULL THEN EXCLUDED.stripe_data ELSE facturas.stripe_data END,
         usuario_id = COALESCE(EXCLUDED.usuario_id, facturas.usuario_id),
         orden_id = COALESCE(EXCLUDED.orden_id, facturas.orden_id),
         numero = COALESCE(EXCLUDED.numero, facturas.numero),
         importe = COALESCE(EXCLUDED.importe, facturas.importe),
         hosted_invoice_url = COALESCE(EXCLUDED.hosted_invoice_url, facturas.hosted_invoice_url),
         pdf_url = COALESCE(EXCLUDED.pdf_url, facturas.pdf_url),
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [paymentIntentId, stripeData, ...valores]
    );

    const facturaId = result.rows[0].id;
    console.log(`✅ [Invoice] Factura guardada exitosamente en BD con ID: ${facturaId}`);
    return facturaId;
  } catch (error) {
    console.error(`❌ [Invoice] Error guardando factura en BD para ${paymentIntentId}:`, error);
    if (error instanceof Error) {
      console.error(`[Invoice] Mensaje de error: ${error.message}`);
    }
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Guarda la factura desde una sesión de Stripe Checkout
 * Obtiene el payment intent asociado a la sesión
 */
export async function saveInvoiceFromCheckoutSession(
  session: Stripe.Checkout.Session,
  stripe: Stripe
): Promise<number | null> {
  try {
    // El payment intent está en session.payment_intent
    // Puede ser string (ID) o Stripe.PaymentIntent (objeto expandido)
    let paymentIntentId: string | null = null;
    let paymentData: Record<string, any> = {};

    if (!session.payment_intent) {
      console.warn("[Invoice] No hay payment_intent en la sesión");
      return null;
    }

    if (typeof session.payment_intent === "string") {
      paymentIntentId = session.payment_intent;
      console.log(`[Invoice] Payment intent es string, recuperando detalles para: ${paymentIntentId}`);
      // Recuperar los detalles completos del payment intent
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
          expand: ["latest_charge"],
        });
        paymentData = paymentIntent as unknown as Record<string, any>;
      } catch (err) {
        console.error(`[Invoice] Error recuperando payment intent ${paymentIntentId}:`, err);
        return null;
      }
    } else if (session.payment_intent && typeof session.payment_intent === "object") {
      paymentIntentId = (session.payment_intent as any).id;
      console.log(`[Invoice] Payment intent es objeto, usando datos expandidos: ${paymentIntentId}`);
      paymentData = session.payment_intent as unknown as Record<string, any>;
    }

    if (!paymentIntentId) {
      console.warn("[Invoice] No se pudo obtener payment intent ID");
      return null;
    }

    const datos = datosDesdeMetadata(session.metadata);

    // Con invoice_creation activado, Stripe emite la factura al cobrar y la deja
    // en session.invoice. Recuperarla aqui da el numero y el PDF sin depender de
    // que llegue el webhook (en local no llega).
    const invoiceId = typeof session.invoice === "string" ? session.invoice : session.invoice?.id;
    if (invoiceId) {
      try {
        const invoice = await stripe.invoices.retrieve(invoiceId);
        // Solo los campos que la factura sí trae: un null suyo no debe borrar el
        // vínculo con el pedido que ya venía en la metadata de la sesión.
        for (const [clave, valor] of Object.entries(datosDesdeInvoice(invoice))) {
          if (valor !== null && valor !== undefined) datos[clave as keyof DatosFactura] = valor as never;
        }
      } catch (err) {
        console.error(`[Invoice] Error recuperando la factura ${invoiceId}:`, err);
      }
    }

    return await saveInvoiceToDatabase(paymentIntentId, paymentData, datos);
  } catch (error) {
    console.error("[Invoice] Error guardando factura desde sesión de checkout:", error);
    throw error;
  }
}

/**
 * Obtiene una factura de la base de datos
 */
export async function getInvoiceFromDatabase(paymentIntentId: string): Promise<Record<string, any> | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT id, stripe_payment_id, stripe_data, created_at, updated_at FROM facturas WHERE stripe_payment_id = $1",
      [paymentIntentId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error("[Invoice] Error obteniendo factura de BD:", error);
    return null;
  } finally {
    client.release();
  }
}

/**
 * Extrae el vínculo con usuario y pedido de la metadata que se adjunta al crear
 * la sesión de checkout y la factura.
 */
function datosDesdeMetadata(metadata: Stripe.Metadata | null | undefined): DatosFactura {
  const ordenId = Number(metadata?.orden_id);
  const usuarioId = Number(metadata?.usuario_id);
  return {
    ordenId: Number.isFinite(ordenId) && ordenId > 0 ? ordenId : null,
    usuarioId: Number.isFinite(usuarioId) && usuarioId > 0 ? usuarioId : null,
  };
}

/**
 * Datos del documento ya emitido por Stripe: número correlativo y enlaces de descarga.
 */
function datosDesdeInvoice(invoice: Stripe.Invoice): DatosFactura {
  const importe = invoice.amount_paid ?? invoice.amount_due ?? null;
  return {
    ...datosDesdeMetadata(invoice.metadata),
    numero: invoice.number ?? null,
    importe: importe === null ? null : importe / 100,
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    pdfUrl: invoice.invoice_pdf ?? null,
  };
}

/**
 * Guarda la factura desde un objeto Stripe.Invoice (eventos invoice.payment_*)
 * Usa payment_intent como clave de deduplicación; cae back a invoice.id
 */
export async function saveInvoiceFromStripeInvoice(
  invoice: Stripe.Invoice
): Promise<number | null> {
  const raw = invoice as any;
  // Desde la API 2025-03 el payment intent vive dentro de invoice.payments;
  // el campo plano se mantiene por compatibilidad con versiones anteriores.
  const pagoAnidado = raw.payments?.data?.[0]?.payment?.payment_intent;
  const key =
    typeof raw.payment_intent === "string"
      ? raw.payment_intent
      : typeof raw.payment_intent === "object" && raw.payment_intent !== null
      ? raw.payment_intent.id
      : typeof pagoAnidado === "string"
      ? pagoAnidado
      : pagoAnidado?.id ?? invoice.id;

  return saveInvoiceToDatabase(key, invoice as unknown as Record<string, any>, datosDesdeInvoice(invoice));
}

/**
 * Lista todas las facturas de la base de datos
 */
export async function listInvoicesFromDatabase(limit: number = 100, offset: number = 0): Promise<any[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT id, stripe_payment_id, created_at FROM facturas ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    return result.rows;
  } catch (error) {
    console.error("[Invoice] Error listando facturas de BD:", error);
    return [];
  } finally {
    client.release();
  }
}
