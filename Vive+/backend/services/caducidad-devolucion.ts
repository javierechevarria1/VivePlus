import type { PoolClient } from "pg";
import { avisarRetornoCaducado } from "./email-devolucion";
import { anularEtiqueta } from "./sendcloud";

// Cierra las devoluciones aceptadas cuyo paquete nunca salió.
//
// Sin esto se quedaban en «esperando paquete» para siempre: el pedido no se
// cerraba, la etiqueta comprada se perdía sin que nadie lo supiera, y el
// comprador tampoco podía volver a pedirla porque seguía figurando abierta.
//
// No se reembolsa nada, y esa es la razón de ser del plazo: el artículo no ha
// vuelto. Si el comprador sigue dentro de sus 14 días puede pedirla otra vez y
// se le manda una etiqueta nueva.

export async function caducarRetornosVencidos(client: PoolClient): Promise<number[]> {
  // El cambio de estado hace de candado, igual que en la liberación de ventas:
  // si el barrido corre dos veces, la segunda no encuentra nada.
  const { rows } = await client.query<{ id: number; sendcloud_id: string | null }>(
    `UPDATE devoluciones
     SET estado = 'caducada', caducado_en = NOW()
     WHERE estado = 'aceptada'
       AND limite_retorno IS NOT NULL AND limite_retorno <= NOW()
     RETURNING id, sendcloud_id`
  );

  for (const devolucion of rows) {
    // La etiqueta se compró y el paquete nunca salió: se anula para que el
    // transportista no la cobre. Si no se puede —ya recogida, cuenta sin
    // permisos, Sendcloud caído— queda anotado y se reclama a mano, pero la
    // devolución se cierra igual.
    if (devolucion.sendcloud_id) {
      const anulada = await anularEtiqueta(devolucion.sendcloud_id);
      if (!anulada.ok) {
        console.warn(`[caducidad] No se pudo anular la etiqueta de la devolución ${devolucion.id}: ${anulada.motivo}`);
        const motivoSinEtiqueta = `Etiqueta sin anular al caducar: ${anulada.motivo}`;
        await client.query(
          `UPDATE devoluciones SET motivo_sin_etiqueta = $1 WHERE id = $2`,
          [motivoSinEtiqueta, devolucion.id]
        );
      } else {
        console.log(`[caducidad] Etiqueta de la devolución ${devolucion.id} anulada`);
      }
    }

    await avisarRetornoCaducado(client, devolucion.id);
  }

  return rows.map(r => r.id);
}
