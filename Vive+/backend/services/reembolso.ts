import { PoolClient } from "pg";
import Stripe from "stripe";
import { envioTienda, porteDevolucion } from "./tarifas-segunda-mano";

// Devuelve el dinero al comprador. Sirve tanto para un pedido de la tienda
// como para una venta de segunda mano, que llegan al mismo sitio por caminos
// distintos: el pedido guarda su cobro en la factura y la venta lo tiene en
// su propia fila.

export const DIAS_DESISTIMIENTO = 14;

function getStripe(): Stripe | undefined {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key, { apiVersion: "2026-03-25.dahlia" as any }) : undefined;
}

// Localiza el cobro original. Sin él no hay nada que devolver.
//
// `total` es lo que pagó el comprador y hace de techo: no se puede devolver
// más. `sugerido` es lo que se devuelve si nadie dice otra cosa.
//
// En un desistimiento se le devuelve **todo lo que pagó, portes de ida
// incluidos** —la ley obliga a ello— y se le descuenta el coste del viaje de
// vuelta, que sí se puede repercutir porque se le avisa antes de comprar.
// Cuando el fallo es nuestro (llegó roto, no llegó, no era lo que pidió) no se
// descuenta nada: se sube al total a mano desde el campo de la ficha.
async function cobroDelOrigen(
  client: PoolClient,
  origen: { ordenId?: number | null; ventaId?: number | null; descontarRetorno?: boolean }
): Promise<{ paymentIntent: string | null; total: number; sugerido: number } | null> {
  if (origen.ventaId) {
    const { rows } = await client.query(
      `SELECT payment_intent, importe_total FROM ventas_segunda_mano WHERE id = $1`,
      [origen.ventaId]
    );
    if (rows.length === 0) return null;
    // En segunda mano no hay desistimiento: lo que se reclama es que algo
    // falló, así que por defecto se devuelve todo.
    const total = Number(rows[0].importe_total);
    return { paymentIntent: rows[0].payment_intent, total, sugerido: total };
  }

  if (origen.ordenId) {
    // El pedido no guarda el cobro: se llega a él por la factura, que es
    // quien apunta al pago de Stripe.
    const { rows } = await client.query(
      `SELECT o.precio_total, f.stripe_payment_id
       FROM orden o
       LEFT JOIN facturas f ON f.orden_id = o.id
       WHERE o.id = $1
       ORDER BY f.id DESC
       LIMIT 1`,
      [origen.ordenId]
    );
    if (rows.length === 0) return null;

    const total = Number(rows[0].precio_total);

    // El descuento es el del tramo con el que viaja el paquete, que es el
    // mismo con el que salió: el del artículo más grande del pedido.
    const { rows: lineas } = await client.query<{ tamano_paquete: string | null; precio: string; cantidad: number }>(
      `SELECT p.tamano_paquete, p.precio, oi.cantidad
       FROM orden_item oi JOIN productos p ON p.id = oi.producto_id
       WHERE oi.orden_id = $1 AND p.segunda_mano = false`,
      [origen.ordenId]
    );

    // Solo se descuenta cuando el comprador devuelve porque ha cambiado de
    // opinión. Si el fallo es nuestro, el retorno lo pagamos nosotros y no
    // hace falta que nadie se acuerde de escribir el importe entero.
    const vuelta = origen.descontarRetorno !== false && lineas.length > 0
      ? porteDevolucion(envioTienda(
          lineas.map(l => ({ tamano: l.tamano_paquete, precio: Number(l.precio), cantidad: Number(l.cantidad) }))
        ).tramo)
      : 0;

    const sugerido = Math.max(Math.round((total - vuelta) * 100) / 100, 0);

    return { paymentIntent: rows[0].stripe_payment_id, total, sugerido };
  }

  return null;
}

export type ResultadoReembolso =
  | { ok: true; refundId: string; importe: number }
  | { ok: false; motivo: string };

export async function reembolsar(
  client: PoolClient,
  params: {
    ordenId?: number | null;
    ventaId?: number | null;
    // Sin importe se devuelve el sugerido: todo menos el coste del viaje de
    // vuelta en un desistimiento, y todo lo cobrado en cualquier otro caso.
    importe?: number | null;
    // false cuando el fallo es nuestro —una incidencia— y el retorno no se le
    // puede cobrar al comprador.
    descontarRetorno?: boolean;
    motivo?: string;
  }
): Promise<ResultadoReembolso> {
  const stripe = getStripe();
  if (!stripe) return { ok: false, motivo: "Stripe no está configurado" };

  const cobro = await cobroDelOrigen(client, params);
  if (!cobro) return { ok: false, motivo: "No se encontró el pedido o la venta" };
  if (!cobro.paymentIntent) {
    return { ok: false, motivo: "No consta el cobro original: hay que reembolsar a mano desde Stripe" };
  }

  const importe = params.importe && params.importe > 0 ? params.importe : cobro.sugerido;
  if (importe > cobro.total) {
    return { ok: false, motivo: `No se puede devolver más de lo que se cobró (${cobro.total.toFixed(2)} €)` };
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: cobro.paymentIntent,
      amount: Math.round(importe * 100),
      ...(params.motivo ? { metadata: { motivo: params.motivo.slice(0, 400) } } : {}),
    });
    return { ok: true, refundId: refund.id, importe };
  } catch (err) {
    return { ok: false, motivo: err instanceof Error ? err.message : String(err) };
  }
}

// Si el dinero ya salió hacia el vendedor, devolvérselo al comprador deja a la
// plataforma pagando la diferencia de su bolsillo. No se bloquea —a veces hay
// que hacerlo igual— pero quien lo autoriza tiene que saberlo.
export async function avisoSiYaLiberada(
  client: PoolClient,
  ventaId: number
): Promise<string | null> {
  const { rows } = await client.query(
    `SELECT estado, importe_producto, transfer_id FROM ventas_segunda_mano WHERE id = $1`,
    [ventaId]
  );
  if (rows.length === 0) return null;

  const v = rows[0];
  if (v.estado !== "liberado" || !v.transfer_id) return null;

  return `Al vendedor ya se le pagaron ${Number(v.importe_producto).toFixed(2)} €. ` +
    `Reembolsar ahora significa que la plataforma pone ese dinero y se lo reclama al vendedor por su cuenta.`;
}
