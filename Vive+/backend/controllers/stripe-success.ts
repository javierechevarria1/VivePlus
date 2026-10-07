import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { saveInvoiceFromCheckoutSession } from "../services/invoice";
import { procesarSegundaManoVendida, datosCobroDesdeSesion } from "../services/segunda-mano-post-venta";
import { avisarPedidoNuevo } from "../services/email-pedido-nuevo";
import { confirmarCompraAlComprador } from "../services/email-comprador";
import { avisarStockBajo } from "../services/aviso-stock";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.redirect(new URL("/marketplace", req.url));
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // El importe se devuelve en la URL de vuelta porque es el único sitio que
    // sobrevive a la redirección: el carrito ya se ha vaciado para cuando el
    // drawer muestra el resumen, y sessionStorage no existe si el usuario
    // vuelve en otra pestaña.
    const totalPagado = ((session.amount_total ?? 0) / 100).toFixed(2);

    if (session.payment_status === "paid") {
      // Con await: sin él la promesa quedaba a medias al devolver el redirect y
      // la factura no llegaba a guardarse.
      await saveInvoiceFromCheckoutSession(session, stripe).catch((err) =>
        console.error("[stripe-success] Error guardando factura:", err)
      );

      // Confirmar orden pendiente (necesario en local donde el webhook no llega)
      if (session.metadata?.tipo === "orden" && session.metadata?.orden_id) {
        const ordenId = Number(session.metadata.orden_id);
        const { pool } = await import("@/lib/db");
        const client = await pool.connect();
        try {
          await client.query(
            `UPDATE transacciones SET estado = 'correcto'
             WHERE id = (SELECT transaccion_id FROM orden WHERE id = $1)
             AND estado = 'pendiente'`,
            [ordenId]
          );
          await client.query(
            `UPDATE orden SET estado = 'activa' WHERE id = $1 AND estado = 'pendiente'`,
            [ordenId]
          );
          await client.query(
            `UPDATE orden_item SET estado = 'activo' WHERE orden_id = $1 AND estado = 'pendiente'`,
            [ordenId]
          );

          const { rows: itemsOrden } = await client.query(
            `SELECT oi.producto_id, oi.cantidad, p.segunda_mano, p.nombre
             FROM orden_item oi
             JOIN productos p ON p.id = oi.producto_id
             WHERE oi.orden_id = $1`,
            [ordenId]
          );
          const cobro = await datosCobroDesdeSesion(session, stripe);
          const { rows: ordenDatos } = await client.query(
            `SELECT usr_comprador_id, direccion_envio FROM orden WHERE id = $1`,
            [ordenId]
          );

          for (const item of itemsOrden) {
            if (item.segunda_mano) {
              await procesarSegundaManoVendida(client, item.producto_id, stripe, {
                ordenId,
                compradorId: ordenDatos[0]?.usr_comprador_id ?? null,
                direccionEnvio: ordenDatos[0]?.direccion_envio ?? null,
                paymentIntent: cobro.paymentIntent,
                chargeId: cobro.chargeId,
                transferGroup: cobro.transferGroup,
                importeEnvio: cobro.envios[String(item.producto_id)] ?? null,
                tamanoPaquete: cobro.tamanos[String(item.producto_id)] ?? null,
              });
            } else {
              await client.query(
                `UPDATE productos SET stock = GREATEST(stock - $1, 0) WHERE id = $2`,
                [item.cantidad, item.producto_id]
              );
            }
          }

          const usuarioId = session.metadata?.usuario_id;
          if (usuarioId) {
            await client.query(
              `DELETE FROM carrito_items WHERE usuario_id = $1`,
              [Number(usuarioId)]
            );
          }

          await avisarPedidoNuevo(client, ordenId);
          await confirmarCompraAlComprador(client, ordenId);
          await avisarStockBajo(client, itemsOrden.filter((i: { segunda_mano: boolean }) => !i.segunda_mano).map((i: { producto_id: number }) => i.producto_id));

          console.log(`✅ [stripe-success] Orden ${ordenId} confirmada`);
        } catch (err) {
          console.error("❌ [stripe-success] Error confirmando orden:", err);
        } finally {
          client.release();
        }
        return NextResponse.redirect(new URL(`/marketplace?success=true&total=${totalPagado}`, req.url));
      }

      const itemsDataStr = session.metadata?.items_data;
      if (itemsDataStr) {
        const metadataItems = JSON.parse(itemsDataStr);
        const usuarioId = session.client_reference_id;

        const { pool } = await import("@/lib/db");
        const client = await pool.connect();
        try {

          const productosNormales = metadataItems.filter((i: any) => i.categoria !== "Segunda Mano");
          await Promise.all(productosNormales.map(async (item: any) => {
            if (!item.id) return;
            await client.query(
              "UPDATE productos SET stock = stock - $2 WHERE id = $1 AND stock > 0",
              [item.id, item.cantidad]
            );
            if (usuarioId) {
              await client.query(
                "DELETE FROM carrito_items WHERE usuario_id = $1 AND producto_id = $2",
                [usuarioId, item.id]
              );
            }
          }));

          const cobroDirecto = await datosCobroDesdeSesion(session, stripe);
          const productosSegundaMano = metadataItems.filter((i: any) => i.categoria === "Segunda Mano");
          // En paralelo: cada venta reclama su producto con un UPDATE condicional
          // que ya es atómico por sí solo, así que no dependen entre ellas y las
          // llamadas lentas (etiqueta de envío y email al vendedor) se solapan.
          await Promise.all(productosSegundaMano.map((prod: any) =>
            procesarSegundaManoVendida(client, prod.id, stripe, {
              compradorId: usuarioId ? Number(usuarioId) : null,
              direccionEnvio: session.metadata?.direccion_envio ?? null,
              paymentIntent: cobroDirecto.paymentIntent,
              chargeId: cobroDirecto.chargeId,
              transferGroup: cobroDirecto.transferGroup,
              importeEnvio: cobroDirecto.envios[String(prod.id)] ?? null,
              tamanoPaquete: cobroDirecto.tamanos[String(prod.id)] ?? null,
            })
          ));
        } finally {
          client.release();
        }
      }
    }


    return NextResponse.redirect(new URL(`/marketplace?success=true&total=${totalPagado}`, req.url));
  } catch (error) {
    console.error("Error en stripe-success:", error);
    return NextResponse.redirect(new URL("/marketplace?canceled=true", req.url));
  }
}
