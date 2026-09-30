import { PoolClient } from "pg";
import Stripe from "stripe";
import { transferirAVendedor } from "./transferencia-vendedor";
import { avisarDineroLiberado } from "./email-segunda-mano-ciclo";

// Única puerta por la que sale el dinero retenido de una venta de segunda mano.
// La usan tanto la confirmación del comprador como el barrido automático de
// plazos vencidos, así que vive aquí y no dentro de un controlador.
export async function liberarVenta(
  client: PoolClient,
  ventaId: number,
  stripe: Stripe | undefined
): Promise<{ transferId: string | null; importe: number } | null> {
  // El cambio de estado hace de candado: si el cron y el comprador confirman a
  // la vez, solo una de las dos llamadas encuentra la venta sin liberar.
  const { rows } = await client.query(
    `UPDATE ventas_segunda_mano SET estado = 'liberado', liberado_en = NOW(), actualizado_en = NOW()
     WHERE id = $1 AND estado IN ('pagado', 'enviado', 'entregado')
     RETURNING producto_id, vendedor_id, importe_producto, charge_id, transfer_group`,
    [ventaId]
  );
  if (rows.length === 0) return null;

  const venta = rows[0];

  const { rows: vendedorRows } = await client.query(
    `SELECT stripe_connect_id FROM usuarios WHERE id = $1`,
    [venta.vendedor_id]
  );
  const { rows: productoRows } = await client.query(
    `SELECT nombre FROM productos WHERE id = $1`,
    [venta.producto_id]
  );

  const transferId = await transferirAVendedor(client, {
    stripe,
    stripeConnectId: vendedorRows[0]?.stripe_connect_id ?? null,
    productoId: venta.producto_id,
    vendedorId: venta.vendedor_id,
    nombreProducto: productoRows[0]?.nombre ?? `Producto ${venta.producto_id}`,
    // El vendedor cobra el 100% de su precio: envío y gestión los pagó el
    // comprador aparte y no salen de aquí.
    importe: Number(venta.importe_producto),
    ventaId,
    chargeId: venta.charge_id,
    transferGroup: venta.transfer_group,
  });

  if (transferId) {
    await client.query(
      `UPDATE ventas_segunda_mano SET transfer_id = $1 WHERE id = $2`,
      [transferId, ventaId]
    );
  }

  // Aquí y no en los controladores: es la única puerta por la que sale el
  // dinero, así que es el único sitio donde el aviso llega tanto si confirmó
  // el comprador como si lo liberó el barrido o un administrador.
  await avisarDineroLiberado(client, ventaId);

  return { transferId, importe: Number(venta.importe_producto) };
}

// Ventas cuyo plazo de confirmación venció sin que el comprador dijera nada.
// El dinero no puede quedarse retenido para siempre porque no vuelva a entrar.
export async function liberarVencidas(
  client: PoolClient,
  stripe: Stripe | undefined
): Promise<number[]> {
  // 'entregado' entra aquí desde que el transportista confirma la entrega por
  // webhook: esas ventas tienen un plazo corto contado desde la entrega real,
  // no desde el envío.
  const { rows } = await client.query(
    `SELECT id FROM ventas_segunda_mano
     WHERE estado IN ('enviado', 'entregado')
       AND limite_confirmacion IS NOT NULL AND limite_confirmacion <= NOW()`
  );

  const liberadas: number[] = [];
  for (const venta of rows) {
    const resultado = await liberarVenta(client, venta.id, stripe);
    if (resultado) liberadas.push(venta.id);
  }
  return liberadas;
}
