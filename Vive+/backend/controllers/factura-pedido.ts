import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { PoolClient } from "pg";
import { jwtVerify } from "jose";
import Stripe from "stripe";
import { saveInvoiceFromStripeInvoice } from "../services/invoice";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY no configurado");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

async function requireUser(req: NextRequest) {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return { error: "No autorizado" };
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const user_id = (payload.id ?? payload.medicoId) as number | undefined;
    if (!user_id) return { error: "No autorizado" };
    return { user_id, rol: payload.rol as string | undefined };
  } catch {
    return { error: "Token inválido" };
  }
}

/**
 * Localiza en Stripe la factura de un pedido. La Search API tarda hasta un minuto
 * en indexar una factura recién emitida, así que si no aparece se recorre el
 * listado del cliente, que sí es inmediato.
 */
async function buscarFacturaEnStripe(
  client: PoolClient,
  stripe: Stripe,
  ordenId: number,
  usuarioId: number
): Promise<Stripe.Invoice | null> {
  try {
    // La Search API no admite parametros ligados: el id se normaliza a entero
    // antes de entrar en la consulta para que no pueda cerrar la comilla.
    const { data } = await stripe.invoices.search({
      query: `metadata['orden_id']:'${Math.trunc(ordenId)}'`,
      limit: 1,
    });
    if (data[0]) return data[0];
  } catch (err) {
    console.error("[factura-pedido] Búsqueda por metadata no disponible:", err);
  }

  const { rows } = await client.query(
    `SELECT id_stripe FROM stripe_customers WHERE usuario_id = $1 AND estado = 'activo' LIMIT 1`,
    [usuarioId]
  );
  const customer = rows[0]?.id_stripe;
  if (!customer) return null;

  const { data } = await stripe.invoices.list({ customer, limit: 100 });
  return data.find(i => i.metadata?.orden_id === String(ordenId)) ?? null;
}

/**
 * GET /api/factura-pedido?orden_id=123
 * Devuelve la URL del PDF de la factura del pedido. Si todavía no está cacheada la busca
 * en Stripe por la metadata del pedido y la guarda: al volver del checkout la
 * factura puede tardar unos segundos en finalizarse, y en local no hay webhook
 * que la traiga después.
 */
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const ordenId = Number(req.nextUrl.searchParams.get("orden_id"));
  if (!Number.isSafeInteger(ordenId) || ordenId <= 0) {
    return NextResponse.json({ error: "orden_id es obligatorio" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT o.usr_comprador_id, o.estado, f.id AS factura_id, f.pdf_url, f.hosted_invoice_url
       FROM orden o
       LEFT JOIN facturas f ON f.orden_id = o.id
       WHERE o.id = $1`,
      [ordenId]
    );
    if (rows.length === 0) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

    const pedido = rows[0];
    if (pedido.usr_comprador_id !== auth.user_id && auth.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    if (pedido.estado === "pendiente") {
      return NextResponse.json({ error: "El pedido aún no se ha pagado" }, { status: 409 });
    }

    const enlaceGuardado = pedido.pdf_url ?? pedido.hosted_invoice_url;
    if (enlaceGuardado) return NextResponse.json({ ok: true, url: enlaceGuardado });

    const stripe = getStripe();
    const invoice = await buscarFacturaEnStripe(client, stripe, ordenId, pedido.usr_comprador_id);
    const enlace = invoice?.invoice_pdf ?? invoice?.hosted_invoice_url;
    if (!invoice || !enlace) {
      // Sin rastro del pago en la tabla no hay factura que esperar: son los
      // pedidos anteriores a la facturación automática.
      if (!pedido.factura_id) {
        return NextResponse.json(
          { error: "Este pedido no tiene factura: es anterior a la facturación automática." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "La factura todavía se está generando. Inténtalo de nuevo en unos minutos." },
        { status: 202 }
      );
    }

    await saveInvoiceFromStripeInvoice(invoice);
    return NextResponse.json({ ok: true, url: enlace });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[factura-pedido] Error obteniendo la factura:", msg);
    return NextResponse.json({ error: "Error al obtener la factura" }, { status: 500 });
  } finally {
    client.release();
  }
}
