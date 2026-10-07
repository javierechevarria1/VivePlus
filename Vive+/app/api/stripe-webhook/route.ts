import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import Stripe from "stripe";
import { saveInvoiceFromCheckoutSession, saveInvoiceFromStripeInvoice } from "@/backend/services/invoice";
import { procesarSegundaManoVendida, datosCobroDesdeSesion } from "@/backend/services/segunda-mano-post-venta";
import { avisarPedidoNuevo } from "@/backend/services/email-pedido-nuevo";
import { confirmarCompraAlComprador } from "@/backend/services/email-comprador";
import { avisarStockBajo } from "@/backend/services/aviso-stock";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY no configurado");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" as any });
}

// Las facturas de pedidos llegan con billing_reason 'manual'; las de planes con
// 'subscription_create', 'subscription_cycle', 'subscription_update'...
function esFacturaDeSuscripcion(invoice: Stripe.Invoice): boolean {
  return (invoice.billing_reason ?? "").startsWith("subscription");
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Configuración de webhook incorrecta" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    const rawBody = await req.arrayBuffer();
    event = stripe.webhooks.constructEvent(Buffer.from(rawBody), sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] Firma inválida:", msg);
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        
        const stripe = getStripe();

        // Id de la factura emitida por Stripe (invoice_creation en los pagos
        // unicos, la primera factura del ciclo en las suscripciones). Es lo que
        // guarda transacciones.factura_id, que es varchar.
        const facturaStripeId =
          typeof session.invoice === "string" ? session.invoice : session.invoice?.id ?? null;

        try {
          console.log(`[Webhook] Guardando factura para session: ${session.id}`);
          await saveInvoiceFromCheckoutSession(session, stripe);
        } catch (err) {
          console.error(`[Webhook] Error guardando factura:`, err);

        }

        if (session.metadata?.tipo === "orden") {
          const orden_id = Number(session.metadata.orden_id);

          await client.query(
            `UPDATE transacciones SET estado = 'correcto', factura_id = $1
             WHERE id = (SELECT transaccion_id FROM orden WHERE id = $2)`,
            [facturaStripeId, orden_id]
          );
          await client.query(`UPDATE orden SET estado = 'activa' WHERE id = $1`, [orden_id]);
          await client.query(`UPDATE orden_item SET estado = 'activo' WHERE orden_id = $1`, [orden_id]);

          const { rows: itemsOrden } = await client.query(
            `SELECT oi.producto_id, oi.cantidad, p.segunda_mano, p.nombre
             FROM orden_item oi
             JOIN productos p ON p.id = oi.producto_id
             WHERE oi.orden_id = $1`,
            [orden_id]
          );

          const cobro = await datosCobroDesdeSesion(session, stripe);
          const { rows: ordenRows } = await client.query(
            `SELECT usr_comprador_id, direccion_envio FROM orden WHERE id = $1`,
            [orden_id]
          );

          for (const item of itemsOrden) {
            if (item.segunda_mano) {
              await procesarSegundaManoVendida(client, item.producto_id, stripe, {
                ordenId: orden_id,
                compradorId: ordenRows[0]?.usr_comprador_id ?? null,
                direccionEnvio: ordenRows[0]?.direccion_envio ?? null,
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

          await avisarPedidoNuevo(client, orden_id);
          await confirmarCompraAlComprador(client, orden_id);
          await avisarStockBajo(client, itemsOrden.filter(i => !i.segunda_mano).map(i => i.producto_id));

          const usuarioIdOrden = session.metadata?.usuario_id;
          if (usuarioIdOrden) {
            await client.query(`DELETE FROM carrito_items WHERE usuario_id = $1`, [Number(usuarioIdOrden)]);
          }
        } else if (session.metadata?.items_data) {
          // Compra directa desde el carrito (stripe-checkout.ts) sin orden pre-creada:
          // aquí es donde vive segunda mano cuando se compra junto a productos normales.
          const usuarioId = session.metadata?.usuario_id ? Number(session.metadata.usuario_id) : null;
          const itemsParsed: { id: number; nombre: string; categoria: string; cantidad: number; precio: number }[] =
            JSON.parse(session.metadata.items_data);

          const importe = (session.amount_total ?? 0) / 100;
          const direccionEnvio = session.metadata?.direccion_envio ?? "";

          let subtotalArticulos = 0;
          for (const item of itemsParsed) {
            subtotalArticulos += item.precio * item.cantidad;
          }
          // Lo que ingresa la plataforma es exactamente lo que se cobró de más
          // sobre el precio de los artículos: envío + gastos de gestión.
          const comisionTotal = Math.round((importe - subtotalArticulos) * 100) / 100;
          const precioTotal = importe;

          const cobroDirecto = await datosCobroDesdeSesion(session, stripe);
          let ordenIdDirecta: number | null = null;

          const stripeCustomerStr = typeof session.customer === "string" ? session.customer : null;
          let stripeCustomerDbId: number | null = null;
          if (stripeCustomerStr) {
            const { rows: scRows } = await client.query(
              `SELECT id FROM stripe_customers WHERE id_stripe = $1 LIMIT 1`,
              [stripeCustomerStr]
            );
            stripeCustomerDbId = scRows[0]?.id ?? null;
          }

          if (usuarioId && stripeCustomerDbId) {
            const { rows: txRows } = await client.query(
              `INSERT INTO transacciones (stripe_customer_id, importe, estado, tipo, factura_id)
               VALUES ($1, $2, 'correcto', 'pago', $3) RETURNING id`,
              [stripeCustomerDbId, importe, facturaStripeId]
            );
            const transaccionId = txRows[0].id;

            const { rows: ordenRows } = await client.query(
              `INSERT INTO orden (usr_comprador_id, precio_total, direccion_envio, comision, estado, transaccion_id)
               VALUES ($1, $2, $3, $4, 'activa', $5) RETURNING id`,
              [usuarioId, precioTotal, direccionEnvio, comisionTotal, transaccionId]
            );
            const ordenId = ordenRows[0].id;
            ordenIdDirecta = ordenId;

            for (const item of itemsParsed) {
              await client.query(
                `INSERT INTO orden_item (orden_id, producto_id, cantidad, descuento, precio_items, estado)
                 VALUES ($1, $2, $3, 0, $4, 'activo')`,
                [ordenId, item.id ?? null, item.cantidad, item.precio * item.cantidad]
              );
            }

            // En esta rama el pedido nace aquí, después de guardar la factura:
            // sin este vínculo el comprador no podría descargarla desde su cuenta.
            if (cobroDirecto.paymentIntent) {
              await client.query(
                `UPDATE facturas SET orden_id = $1, usuario_id = COALESCE(usuario_id, $2), updated_at = CURRENT_TIMESTAMP
                 WHERE stripe_payment_id = $3 AND orden_id IS NULL`,
                [ordenId, usuarioId, cobroDirecto.paymentIntent]
              );
            }
          }

          for (const item of itemsParsed) {
            if (item.categoria === "Segunda Mano") {
              await procesarSegundaManoVendida(client, item.id, stripe, {
                ordenId: ordenIdDirecta,
                compradorId: usuarioId,
                direccionEnvio: direccionEnvio || null,
                paymentIntent: cobroDirecto.paymentIntent,
                chargeId: cobroDirecto.chargeId,
                transferGroup: cobroDirecto.transferGroup,
                importeEnvio: cobroDirecto.envios[String(item.id)] ?? null,
                tamanoPaquete: cobroDirecto.tamanos[String(item.id)] ?? null,
              });
            } else if (item.id) {
              await client.query(
                `UPDATE productos SET stock = GREATEST(stock - $1, 0) WHERE id = $2`,
                [item.cantidad, item.id]
              );
            }
          }

          if (ordenIdDirecta) {
            await avisarPedidoNuevo(client, ordenIdDirecta);
            await confirmarCompraAlComprador(client, ordenIdDirecta);
          }

          if (usuarioId) {
            await client.query(`DELETE FROM carrito_items WHERE usuario_id = $1`, [usuarioId]);
          }
        }

        // Respaldo por si el navegador nunca llega a /api/confirm-plan tras el
        // checkout embebido (pestaña cerrada, red caída, etc). Misma lógica e
        // idempotencia ("¿ya hay suscripción activa?") que ya usa confirm-plan.ts.
        if (session.metadata?.type === "subscription" && session.mode === "subscription") {
          const usuarioId = Number(session.metadata.userId);
          const planId = session.metadata.planId;

          if (usuarioId && planId) {
            await client.query(
              `UPDATE usuarios SET plan_id = $1, stripe_customer_id = $2 WHERE id = $3`,
              [planId, session.customer, usuarioId]
            );

            const stripeCustomerStr = typeof session.customer === "string" ? session.customer : null;
            let stripeCustomerDbId: number | null = null;
            if (stripeCustomerStr) {
              const { rows: existingCustomer } = await client.query(
                `SELECT id FROM stripe_customers WHERE usuario_id = $1 AND estado = 'activo' LIMIT 1`,
                [usuarioId]
              );
              if (existingCustomer.length === 0) {
                const { rows: scResult } = await client.query(
                  `INSERT INTO stripe_customers (id_stripe, usuario_id, estado) VALUES ($1, $2, 'activo') RETURNING id`,
                  [stripeCustomerStr, usuarioId]
                );
                stripeCustomerDbId = scResult[0].id;
              } else {
                stripeCustomerDbId = existingCustomer[0].id;
              }
            }

            const { rows: activeSub } = await client.query(
              `SELECT id FROM suscripcion WHERE usuario_id = $1 AND estado = 'activo' LIMIT 1`,
              [usuarioId]
            );
            if (activeSub.length === 0 && stripeCustomerDbId) {
              const { rows: planRow } = await client.query(`SELECT intervalo FROM planes WHERE id = $1`, [planId]);
              const intervalo = planRow[0]?.intervalo ?? "mensual";
              const fechaFin = intervalo === "anual"
                ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              const importe = session.amount_total != null ? session.amount_total / 100 : 0;

              const { rows: txResult } = await client.query(
                `INSERT INTO transacciones (stripe_customer_id, importe, fecha, estado, tipo, motivo, factura_id)
                 VALUES ($1, $2, NOW(), 'correcto', 'pago', 'Plan suscripción', $3) RETURNING id`,
                [stripeCustomerDbId, importe, facturaStripeId]
              );
              await client.query(
                `INSERT INTO suscripcion (usuario_id, estado, fecha_ini, fecha_fin, transaccion_id, plan_id)
                 VALUES ($1, 'activo', NOW(), $2, $3, $4)`,
                [usuarioId, fechaFin, txResult[0].id, planId]
              );
            }
          }
        }

        // Respaldo equivalente para planes de organización (confirm-org-plan.ts).
        if (session.metadata?.type === "organizacion" && session.mode === "subscription") {
          const orgId = Number(session.metadata.organizacion_id);
          const planId = session.metadata.plan_id;

          if (orgId && planId) {
            await client.query(`UPDATE organizaciones SET plan_org_id = $1 WHERE id = $2`, [planId, orgId]);

            const { rows: orgUserRows } = await client.query(
              `SELECT usuario_organizacion_id FROM organizaciones WHERE id = $1`,
              [orgId]
            );
            const usuarioId = orgUserRows[0]?.usuario_organizacion_id;

            if (usuarioId) {
              await client.query(
                `UPDATE usuarios SET plan_id = $1, stripe_customer_id = $2 WHERE id = $3`,
                [planId, session.customer, usuarioId]
              );

              const planNombre = (session.metadata?.plan_nombre ?? "").toLowerCase();
              if (planNombre.includes("banner")) {
                const { rows: existingAnuncio } = await client.query(
                  `SELECT id FROM anuncios WHERE organizacion_id = $1 LIMIT 1`,
                  [orgId]
                );
                if (existingAnuncio.length === 0) {
                  await client.query(
                    `INSERT INTO anuncios (empresa, imagen, url_destino, ubicacion, activo, organizacion_id)
                     VALUES ($1, $2, $3, 'organizaciones', true, $4)`,
                    [
                      session.metadata?.org_nombre || "Organización",
                      session.metadata?.org_logo ?? "",
                      session.metadata?.org_web || "/organizaciones",
                      orgId,
                    ]
                  );
                }
              }

              const stripeCustomerStr = typeof session.customer === "string" ? session.customer : null;
              let stripeCustomerDbId: number | null = null;
              if (stripeCustomerStr) {
                const { rows: existingCustomer } = await client.query(
                  `SELECT id FROM stripe_customers WHERE usuario_id = $1 AND estado = 'activo' LIMIT 1`,
                  [usuarioId]
                );
                if (existingCustomer.length === 0) {
                  const { rows: scResult } = await client.query(
                    `INSERT INTO stripe_customers (id_stripe, usuario_id, estado) VALUES ($1, $2, 'activo') RETURNING id`,
                    [stripeCustomerStr, usuarioId]
                  );
                  stripeCustomerDbId = scResult[0].id;
                } else {
                  stripeCustomerDbId = existingCustomer[0].id;
                }
              }

              const { rows: activeSub } = await client.query(
                `SELECT id FROM suscripcion WHERE usuario_id = $1 AND estado = 'activo' LIMIT 1`,
                [usuarioId]
              );
              if (activeSub.length === 0 && stripeCustomerDbId) {
                const { rows: planRow } = await client.query(`SELECT intervalo FROM planes WHERE id = $1`, [planId]);
                const intervalo = planRow[0]?.intervalo ?? "mensual";
                const fechaFin = intervalo === "anual"
                  ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                  : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                const importe = session.amount_total != null ? session.amount_total / 100 : 0;

                const { rows: txResult } = await client.query(
                  `INSERT INTO transacciones (stripe_customer_id, importe, fecha, estado, tipo, motivo, factura_id)
                   VALUES ($1, $2, NOW(), 'correcto', 'pago', 'Plan organización', $3) RETURNING id`,
                  [stripeCustomerDbId, importe, facturaStripeId]
                );
                await client.query(
                  `INSERT INTO suscripcion (usuario_id, estado, fecha_ini, fecha_fin, transaccion_id, plan_id)
                   VALUES ($1, 'activo', NOW(), $2, $3, $4)`,
                  [usuarioId, fechaFin, txResult[0].id, planId]
                );
              }
            }
          }
        }
        break;
      }

      // Evento de cuenta conectada: mantiene al día la caché que leen el listado y
      // el checkout. Requiere que el endpoint escuche eventos de connected accounts.
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await client.query(
          `UPDATE usuarios SET stripe_payouts_enabled = $1 WHERE stripe_connect_id = $2`,
          [account.payouts_enabled === true, account.id]
        );
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await saveInvoiceFromStripeInvoice(invoice);

        // Los pedidos tambien emiten factura desde que se activo invoice_creation,
        // y esos eventos no deben tocar la suscripcion del comprador.
        if (!esFacturaDeSuscripcion(invoice)) break;

        const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
        if (!customerId) break;

        const { rows: scRows } = await client.query(
          `SELECT usuario_id FROM stripe_customers WHERE id_stripe = $1 LIMIT 1`,
          [customerId]
        );
        if (scRows.length === 0) break;

        const usuarioId = scRows[0].usuario_id;
        await client.query(
          `UPDATE suscripcion SET estado = 'activa', fecha_fin = NOW() + INTERVAL '1 month'
           WHERE usuario_id = $1 AND estado = 'activa'`,
          [usuarioId]
        );
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await saveInvoiceFromStripeInvoice(invoice);

        // Un pedido que falla al cobrar no puede dar de baja el plan del usuario.
        if (!esFacturaDeSuscripcion(invoice)) break;

        const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
        if (!customerId) break;

        const { rows: scRows } = await client.query(
          `SELECT id, usuario_id FROM stripe_customers WHERE id_stripe = $1 LIMIT 1`,
          [customerId]
        );
        if (scRows.length === 0) break;

        const usuarioIdFailed = scRows[0].usuario_id;
        await client.query(
          `UPDATE suscripcion SET estado = 'inactiva' WHERE usuario_id = $1`,
          [usuarioIdFailed]
        );
        await client.query(
          `UPDATE usuarios SET plan_id = NULL WHERE id = $1`,
          [usuarioIdFailed]
        );

        // stripe_customer_id es la clave de stripe_customers, no el cus_... de
        // Stripe: con el identificador de Stripe el INSERT fallaba entero.
        await client.query(
          `INSERT INTO transacciones (stripe_customer_id, importe, estado, tipo, motivo, factura_id)
           VALUES ($1, $2, 'incorrecto', 'pago', 'Pago fallido', $3)`,
          [scRows[0].id, (invoice.amount_due ?? 0) / 100, invoice.id ?? null]
        );
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : null;
        if (!customerId) break;

        const { rows: scRows } = await client.query(
          `SELECT usuario_id FROM stripe_customers WHERE id_stripe = $1 LIMIT 1`,
          [customerId]
        );
        if (scRows.length === 0) break;

        const usuarioId = scRows[0].usuario_id;
        await client.query(
          `UPDATE suscripcion SET estado = 'inactiva', fecha_fin = NOW() WHERE usuario_id = $1`,
          [usuarioId]
        );
        await client.query(`UPDATE usuarios SET plan_id = NULL WHERE id = $1`, [usuarioId]);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const customerId = typeof charge.customer === "string" ? charge.customer : null;
        if (!customerId) break;

        // Igual que en invoice.payment_failed: hay que traducir el cus_... a la
        // fila de stripe_customers antes de guardar la transaccion.
        const { rows: scRows } = await client.query(
          `SELECT id FROM stripe_customers WHERE id_stripe = $1 LIMIT 1`,
          [customerId]
        );
        if (scRows.length === 0) break;

        await client.query(
          `INSERT INTO transacciones (stripe_customer_id, importe, estado, tipo, motivo)
           VALUES ($1, $2, 'correcto', 'reembolso', $3)`,
          [
            scRows[0].id,
            (charge.amount_refunded ?? 0) / 100,
            charge.refunds?.data[0]?.reason ?? "Reembolso",
          ]
        );
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[stripe-webhook] Error procesando evento:", msg);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  } finally {
    client.release();
  }
}
