import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import type { PoolClient } from "pg";
import { pool } from "@/lib/db";
import { estadoVentaDesdeEnvio } from "@/backend/services/sendcloud";
import { avisarEnvioAlComprador } from "@/backend/services/email-comprador";
import { avisarRetornoRecibido } from "@/backend/services/email-devolucion";
import { pedirConfirmacionRecepcion } from "@/backend/services/email-segunda-mano-ciclo";
import { DIAS_AUTO_CONFIRMACION, DIAS_TRAS_ENTREGA, fechaLimite } from "@/backend/services/tarifas-segunda-mano";

// Avisos de seguimiento del transportista. Es lo que automatiza el paso de
// "enviado" a "entregado" sin depender de que el comprador entre a confirmar,
// y lo que permitirá acortar el plazo de liberación.
//
// Va en su propia ruta y no en el router de /api/[slug] porque necesita el
// cuerpo crudo para verificar la firma, igual que el webhook de Stripe.

function firmaValida(cuerpo: string, firma: string | null): boolean {
  const secreto = process.env.SENDCLOUD_WEBHOOK_SECRET;
  if (!secreto || !firma) return false;

  const esperada = crypto.createHmac("sha256", secreto).update(cuerpo, "utf8").digest("hex");

  // Comparación en tiempo constante: un `===` filtra información sobre la
  // firma esperada según cuántos caracteres coinciden.
  const a = Buffer.from(esperada);
  const b = Buffer.from(firma);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Los pedidos de la tienda no tienen retención: el dinero ya es de la
// plataforma. Aquí solo se refleja por dónde va el paquete, para que el
// comprador lo vea y el administrador sepa qué queda pendiente.
async function actualizarPedidoTienda(
  client: PoolClient,
  pedido: { id: number; estado: string },
  estadoEnvio: string | null,
  nuevoEstado: "enviado" | "entregado" | null,
  parcel: { tracking_number?: string; tracking_url?: string }
) {
  await client.query(
    `UPDATE orden
     SET estado_envio = $1,
         seguimiento = COALESCE($2, seguimiento),
         seguimiento_url = COALESCE($3, seguimiento_url)
     WHERE id = $4`,
    [estadoEnvio, parcel.tracking_number ?? null, parcel.tracking_url ?? null, pedido.id]
  );

  if (nuevoEstado === "enviado" && pedido.estado === "activa") {
    await client.query(
      `UPDATE orden SET estado = 'enviada', enviado_en = COALESCE(enviado_en, NOW())
       WHERE id = $1 AND estado = 'activa'`,
      [pedido.id]
    );
    console.log(`[sendcloud-webhook] Pedido ${pedido.id} marcado como enviado`);
    // Se avisa después de guardar el seguimiento, para que el correo lo lleve.
    await avisarEnvioAlComprador(client, pedido.id);
  }

  if (nuevoEstado === "entregado" && pedido.estado !== "entregada") {
    await client.query(
      `UPDATE orden SET estado = 'entregada', entregado_en = COALESCE(entregado_en, NOW())
       WHERE id = $1`,
      [pedido.id]
    );
    console.log(`[sendcloud-webhook] Pedido ${pedido.id} entregado`);
  }
}

// El paquete de una devolución hace el camino inverso: sale de casa del
// comprador y llega a la nuestra. Cuando llega, la devolución queda lista para
// reembolsar — el dinero no sale aquí, porque primero hay que abrir la caja y
// ver qué ha vuelto.
async function actualizarDevolucion(
  client: PoolClient,
  devolucion: { id: number; estado: string },
  estadoEnvio: string | null,
  nuevoEstado: "enviado" | "entregado" | null,
  parcel: { tracking_number?: string; tracking_url?: string }
) {
  await client.query(
    `UPDATE devoluciones
     SET estado_envio = $1,
         seguimiento = COALESCE($2, seguimiento),
         seguimiento_url = COALESCE($3, seguimiento_url)
     WHERE id = $4`,
    [estadoEnvio, parcel.tracking_number ?? null, parcel.tracking_url ?? null, devolucion.id]
  );

  if (nuevoEstado !== "entregado") return;
  if (devolucion.estado !== "aceptada" && devolucion.estado !== "caducada") return;

  // También se recupera desde 'caducada': que el plazo venciera no significa
  // que el paquete no vaya a llegar, y si llega es nuestro y hay que
  // reembolsar.
  //
  // Pero solo si no hay otra devolución abierta sobre la misma compra: al
  // caducar, el comprador puede volver a pedirla, y reabrir la vieja dejaría
  // dos abiertas a la vez — que es justo lo que impide el índice. Sin esta
  // guarda, un paquete que llega tarde reventaría el webhook entero.
  const { rowCount } = await client.query(
    `UPDATE devoluciones d
     SET estado = 'recibida', recibido_en = COALESCE(d.recibido_en, NOW())
     WHERE d.id = $1
       AND d.estado IN ('aceptada', 'caducada')
       AND NOT EXISTS (
         SELECT 1 FROM devoluciones otra
         WHERE otra.id <> d.id
           AND otra.estado IN ('solicitada', 'aceptada', 'recibida')
           AND (
             (d.orden_id IS NOT NULL AND otra.orden_id = d.orden_id) OR
             (d.venta_id IS NOT NULL AND otra.venta_id = d.venta_id)
           )
       )`,
    [devolucion.id]
  );

  if (rowCount === 0) {
    // El paquete está aquí, pero su devolución ya no es la que manda. Queda
    // anotado el estado del envío y lo resuelve una persona.
    console.warn(
      `[sendcloud-webhook] Llegó el paquete de la devolución ${devolucion.id}, ` +
      `pero hay otra devolución abierta sobre la misma compra: se deja como está`
    );
    return;
  }

  console.log(`[sendcloud-webhook] Devolución ${devolucion.id} recibida; lista para reembolsar`);
  await avisarRetornoRecibido(client, devolucion.id);
}

export async function POST(req: NextRequest) {
  const cuerpo = await req.text();

  if (!firmaValida(cuerpo, req.headers.get("sendcloud-signature"))) {
    console.warn("[sendcloud-webhook] Firma inválida; petición descartada");
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let evento: { action?: string; parcel?: { id?: number | string; status?: { message?: string }; tracking_number?: string; tracking_url?: string } };
  try {
    evento = JSON.parse(cuerpo);
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const parcel = evento.parcel;
  if (!parcel?.id) return NextResponse.json({ received: true });

  const estadoEnvio = parcel.status?.message ?? null;
  const nuevoEstado = estadoVentaDesdeEnvio(estadoEnvio);

  const client = await pool.connect();
  try {
    // El mismo paquete puede ser tres cosas: una venta entre particulares, un
    // pedido de la tienda o la vuelta de una devolución. Se mira en los tres
    // sitios, empezando por el más frecuente.
    const { rows: pedidos } = await client.query(
      `SELECT id, estado FROM orden WHERE sendcloud_id = $1`,
      [String(parcel.id)]
    );
    if (pedidos.length > 0) {
      await actualizarPedidoTienda(client, pedidos[0], estadoEnvio, nuevoEstado, parcel);
      return NextResponse.json({ received: true });
    }

    const { rows: devoluciones } = await client.query(
      `SELECT id, estado FROM devoluciones WHERE sendcloud_id = $1`,
      [String(parcel.id)]
    );
    if (devoluciones.length > 0) {
      await actualizarDevolucion(client, devoluciones[0], estadoEnvio, nuevoEstado, parcel);
      return NextResponse.json({ received: true });
    }

    const { rows } = await client.query(
      `SELECT id, estado FROM ventas_segunda_mano WHERE sendcloud_id = $1`,
      [String(parcel.id)]
    );
    if (rows.length === 0) return NextResponse.json({ received: true });

    const venta = rows[0];

    // El estado en crudo se guarda siempre, aunque no haga avanzar la venta:
    // es lo que permite ver por qué un paquete se quedó parado.
    await client.query(
      `UPDATE ventas_segunda_mano
       SET estado_envio = $1,
           seguimiento = COALESCE($2, seguimiento),
           seguimiento_url = COALESCE($3, seguimiento_url),
           actualizado_en = NOW()
       WHERE id = $4`,
      [estadoEnvio, parcel.tracking_number ?? null, parcel.tracking_url ?? null, venta.id]
    );

    // La orden lleva copia del envío para poder consultarlo sin saber de
    // antemano si la vendía la tienda o un particular.
    await client.query(
      `UPDATE orden o
       SET estado_envio = $1,
           seguimiento = COALESCE($2, o.seguimiento),
           seguimiento_url = COALESCE($3, o.seguimiento_url)
       FROM ventas_segunda_mano v
       WHERE v.id = $4 AND o.id = v.orden_id`,
      [estadoEnvio, parcel.tracking_number ?? null, parcel.tracking_url ?? null, venta.id]
    );

    if (nuevoEstado === "enviado" && venta.estado === "pagado") {
      // El transportista ya tiene el paquete: arranca el plazo de
      // confirmación sin que el vendedor tenga que anotar nada.
      await client.query(
        `UPDATE ventas_segunda_mano
         SET estado = 'enviado', enviado_en = COALESCE(enviado_en, NOW()), limite_confirmacion = $1
         WHERE id = $2 AND estado = 'pagado'`,
        [fechaLimite(DIAS_AUTO_CONFIRMACION), venta.id]
      );
      console.log(`[sendcloud-webhook] Venta ${venta.id} marcada como enviada`);
    }

    if (nuevoEstado === "entregado" && (venta.estado === "pagado" || venta.estado === "enviado")) {
      // El dinero NO sale aquí. Saber que el paquete llegó no es saber que
      // llegó en condiciones: el comprador conserva su ventana para avisar de
      // que está roto o no es lo que compró. Lo que cambia respecto al flujo
      // manual es que ahora el plazo cuenta desde la entrega real y no desde
      // el envío, así que puede ser mucho más corto.
      await client.query(
        `UPDATE ventas_segunda_mano
         SET estado = 'entregado', entregado_en = NOW(), limite_confirmacion = $1
         WHERE id = $2`,
        [fechaLimite(DIAS_TRAS_ENTREGA), venta.id]
      );
      console.log(`[sendcloud-webhook] Venta ${venta.id} entregada; se libera en ${DIAS_TRAS_ENTREGA} días si nadie reclama`);

      // El comprador tiene ahora una ventana corta para decir que algo va mal.
      // Si no se le avisa, la deja pasar sin saber que existía.
      await pedirConfirmacionRecepcion(client, venta.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[sendcloud-webhook] Error procesando evento:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  } finally {
    client.release();
  }
}
