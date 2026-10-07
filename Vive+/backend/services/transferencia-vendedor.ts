import { Pool, PoolClient } from "pg";
import Stripe from "stripe";


export async function vendedorPuedeCobrar(
  stripeConnectId: string | null | undefined,
  stripe: Stripe | undefined
): Promise<boolean> {
  if (!stripeConnectId || !stripe) return false;
  try {
    const account = await stripe.accounts.retrieve(stripeConnectId);
    return account.payouts_enabled === true;
  } catch {
    return false;
  }
}

// Consulta el estado real en Stripe y lo persiste en usuarios.stripe_payouts_enabled,
// que es lo que leen el listado y el checkout para no llamar a Stripe por cada vendedor.
export async function sincronizarEstadoCobro(
  db: Pool | PoolClient,
  usuarioId: number,
  stripeConnectId: string | null | undefined,
  stripe: Stripe | undefined
): Promise<boolean> {
  const puede = await vendedorPuedeCobrar(stripeConnectId, stripe);
  await db.query(
    `UPDATE usuarios SET stripe_payouts_enabled = $1 WHERE id = $2`,
    [puede, usuarioId]
  );
  return puede;
}

export async function transferirAVendedor(
  client: PoolClient,
  params: {
    stripe?: Stripe;
    stripeConnectId: string | null;
    productoId: number;
    vendedorId: number;
    nombreProducto: string;
    importe: number;
    ventaId?: number;
    // Cobro concreto del que sale este dinero. Sin él, el transfer tira del
    // balance disponible de la plataforma y falla si ese día no lo cubre;
    // con él, Stripe lo vincula al pago del comprador y da igual el balance.
    chargeId?: string | null;
    transferGroup?: string | null;
  }
): Promise<string | null> {
  const {
    stripe, stripeConnectId, productoId, vendedorId, nombreProducto, importe,
    ventaId, chargeId, transferGroup,
  } = params;

  const registrarPendiente = (motivo: string) =>
    client.query(
      `INSERT INTO transferencias_pendientes (producto_id, vendedor_id, importe, motivo, venta_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [productoId, vendedorId, importe, motivo, ventaId ?? null]
    ).catch(e => console.error("[Connect Transfer] Error registrando pendiente:", e));

  if (!stripeConnectId) {
    console.warn(`[Connect Transfer] Vendedor ${vendedorId} sin cuenta conectada — transferencia pendiente para producto "${nombreProducto}" (€${importe.toFixed(2)})`);
    await registrarPendiente(`Vendedor sin cuenta Stripe Connect para "${nombreProducto}"`);
    return null;
  }

  if (!stripe) {
    console.warn(`[Connect Transfer] Sin instancia de Stripe — transferencia pendiente para producto "${nombreProducto}" (€${importe.toFixed(2)})`);
    await registrarPendiente(`Stripe no disponible al procesar la venta de "${nombreProducto}"`);
    return null;
  }

  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(importe * 100),
      currency: "eur",
      destination: stripeConnectId,
      description: `Venta segunda mano: ${nombreProducto}`,
      ...(chargeId ? { source_transaction: chargeId } : {}),
      ...(transferGroup ? { transfer_group: transferGroup } : {}),
    });
    return transfer.id;
  } catch (err) {
    console.error("[Connect Transfer] Error:", err);
    const motivo = err instanceof Error ? err.message : String(err);
    await registrarPendiente(`Transfer fallido para "${nombreProducto}": ${motivo}`);
    return null;
  }
}
