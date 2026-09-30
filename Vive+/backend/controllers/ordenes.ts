import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";
import Stripe from "stripe";
// El vendedor cobra el 100% de su precio. Lo que ingresa la plataforma son los
// dos conceptos que se le suman al comprador, y que viven en el servicio de
// tarifas para que checkout, post-venta y frontend digan siempre lo mismo.
import { comisionGestion, envioTienda, esTamanoValido, tarifaEnvio, TAMANO_POR_DEFECTO } from "@/backend/services/tarifas-segunda-mano";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET!
);


function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY no configurado");
  return new Stripe(key, { apiVersion: "2023-10-16" as any });
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

async function getOrCreateStripeCustomer(client: any, user_id: number): Promise<{ dbId: number; stripeId: string }> {
  const { rows } = await client.query(
    `SELECT id, id_stripe FROM stripe_customers WHERE usuario_id = $1 AND estado = 'activo' LIMIT 1`,
    [user_id]
  );
  if (rows.length > 0) return { dbId: rows[0].id, stripeId: rows[0].id_stripe };

  const { rows: userRows } = await client.query(
    `SELECT email FROM usuarios WHERE id = $1`,
    [user_id]
  );
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: userRows[0]?.email,
    // Stripe emite la factura en el idioma del cliente: sin esto sale en inglés.
    preferred_locales: ["es-ES"],
    metadata: { usuario_id: String(user_id) },
  });
  const { rows: inserted } = await client.query(
    `INSERT INTO stripe_customers (id_stripe, usuario_id, estado) VALUES ($1, $2, 'activo') RETURNING id`,
    [customer.id, user_id]
  );
  return { dbId: inserted[0].id, stripeId: customer.id };
}

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const client = await pool.connect();

  try {
    if (id) {
      // Los importes de envío y gestión se sacan de las ventas de segunda mano
      // como subconsultas y no con un JOIN: unirlas aquí multiplicaría las
      // filas y el json_agg repetiría las líneas del pedido.
      const { rows } = await client.query(
        `SELECT o.*,
          -- La tabla orden no guarda fecha propia: la del pago está en
          -- transacciones y, si el pedido no llegó a tener transacción, se cae
          -- a la de sus líneas.
          COALESCE(t.fecha, (SELECT MIN(oi_f.creado_en) FROM orden_item oi_f WHERE oi_f.orden_id = o.id)) AS creado_en,
          -- Días que le quedan al comprador para desistir. Cuenta desde la
          -- entrega, y si el transportista aún no la ha confirmado, desde la
          -- compra: no puede perjudicarle que nos falte el dato.
          CEIL(14 - EXTRACT(EPOCH FROM (NOW() - COALESCE(o.entregado_en, t.fecha, NOW()))) / 86400)::int AS dias_devolucion,
          -- Ya hay una devolución en curso o resuelta a favor: no procede
          -- ofrecer el botón otra vez.
          EXISTS (SELECT 1 FROM devoluciones d WHERE d.orden_id = o.id
                  AND d.estado IN ('solicitada','aceptada','recibida','reembolsada')) AS devolucion_abierta,
          -- En qué punto va, para que el comprador no tenga que esperar a un
          -- correo para saberlo — y para darle su etiqueta de vuelta, que es
          -- lo único que tiene que hacer él.
          (SELECT json_build_object(
             'id', d2.id, 'estado', d2.estado,
             'tiene_etiqueta', d2.etiqueta_url IS NOT NULL,
             'seguimiento', d2.seguimiento, 'seguimiento_url', d2.seguimiento_url,
             'transportista', d2.transportista,
             -- Días que le quedan para dejar el paquete. Se calcula aquí y no
             -- en la pantalla por lo mismo que el plazo de desistimiento: el
             -- reloj del navegador no decide plazos.
             'dias_para_enviar', CASE WHEN d2.limite_retorno IS NULL THEN NULL
               ELSE CEIL(EXTRACT(EPOCH FROM (d2.limite_retorno - NOW())) / 86400)::int END)
           FROM devoluciones d2 WHERE d2.orden_id = o.id
           ORDER BY d2.creado_en DESC LIMIT 1) AS devolucion,
          (SELECT COALESCE(SUM(importe_envio), 0) FROM ventas_segunda_mano WHERE orden_id = o.id) AS envio_total,
          (SELECT COALESCE(SUM(importe_gestion), 0) FROM ventas_segunda_mano WHERE orden_id = o.id) AS gestion_total,
          json_agg(
            json_build_object(
              'id', oi.id,
              'producto_id', oi.producto_id,
              'nombre', p.nombre,
              'imagen', p.imagen,
              'segunda_mano', p.segunda_mano,
              'cantidad', oi.cantidad,
              'descuento', oi.descuento,
              'precio_items', oi.precio_items,
              'estado', oi.estado
            )
          ) AS items
         FROM orden o
         LEFT JOIN orden_item oi ON oi.orden_id = o.id
         LEFT JOIN productos p ON p.id = oi.producto_id
         LEFT JOIN transacciones t ON t.id = o.transaccion_id
         WHERE o.id = $1 AND ($2::text = 'admin' OR o.usr_comprador_id = $3)
         GROUP BY o.id, t.fecha`,
        [Number(id), auth.rol ?? "", auth.user_id]
      );
      if (rows.length === 0) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
      return NextResponse.json({ ok: true, data: rows[0] });
    }

    const esAdmin = auth.rol === "admin";
    const { rows } = esAdmin
      ? await client.query(
          `SELECT o.id, o.usr_comprador_id, o.precio_total, o.estado, o.comision,
                  COALESCE(t.fecha, (SELECT MIN(oi_f.creado_en) FROM orden_item oi_f WHERE oi_f.orden_id = o.id)) AS creado_en,
                  u.username AS comprador_nombre,
                  f.numero AS factura_numero, f.pdf_url AS factura_pdf_url,
                  f.hosted_invoice_url AS factura_url
           FROM orden o
           LEFT JOIN usuarios u ON u.id = o.usr_comprador_id
           LEFT JOIN transacciones t ON t.id = o.transaccion_id
           LEFT JOIN facturas f ON f.orden_id = o.id
           ORDER BY creado_en DESC NULLS LAST`
        )
      : await client.query(
          `SELECT o.id, o.usr_comprador_id, o.precio_total, o.estado, o.comision,
                  COALESCE(t.fecha, (SELECT MIN(oi_f.creado_en) FROM orden_item oi_f WHERE oi_f.orden_id = o.id)) AS creado_en,
                  u.username AS comprador_nombre,
                  f.numero AS factura_numero, f.pdf_url AS factura_pdf_url,
                  f.hosted_invoice_url AS factura_url
           FROM orden o
           LEFT JOIN usuarios u ON u.id = o.usr_comprador_id
           LEFT JOIN transacciones t ON t.id = o.transaccion_id
           LEFT JOIN facturas f ON f.orden_id = o.id
           WHERE o.usr_comprador_id = $1
           ORDER BY creado_en DESC NULLS LAST`,
          [auth.user_id]
        );
    return NextResponse.json({ ok: true, data: rows });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}


export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = await req.json();
  const { items, direccion_envio } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items es obligatorio y no puede estar vacío" }, { status: 400 });
  }
  if (!direccion_envio?.trim()) {
    return NextResponse.json({ error: "direccion_envio es obligatoria" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const productoIds = items.map((i: any) => Number(i.producto_id));
    // FOR UPDATE serializa dos compras simultáneas del mismo producto: la segunda
    // espera al COMMIT de la primera y ya ve su orden pendiente / su borrado.
    const { rows: productos } = await client.query(
      `SELECT id, nombre, precio, segunda_mano, stock, estado, id_vendedor, tamano_paquete FROM productos
       WHERE id = ANY($1::int[])
       ORDER BY id
       FOR UPDATE`,
      [productoIds]
    );

    const productoMap = new Map<number, any>(productos.map((p: any) => [p.id, p]));

    // Un artículo de segunda mano vendido ya no se borra, sigue en la tabla
    // con estado 'vendido': hay que descartarlo igual que si no existiera.
    const noDisponibles = productoIds.filter((id: number) => {
      const producto = productoMap.get(id);
      return !producto || (producto.segunda_mano && producto.estado !== "disponible");
    });
    if (noDisponibles.length > 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Uno o más productos ya no están disponibles (pueden haberse vendido)", no_disponibles: noDisponibles },
        { status: 409 }
      );
    }

    for (const item of items) {
      const producto = productoMap.get(Number(item.producto_id));
      if (producto.stock < item.cantidad) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: `Stock insuficiente para "${producto.nombre}"` },
          { status: 400 }
        );
      }
    }

    // Segunda mano: pieza única. Si otro comprador tiene un checkout abierto para
    // ella, se rechaza aquí en vez de dejar que ambos paguen y uno se quede sin producto.
    const idsSegundaMano = productos.filter((p: any) => p.segunda_mano).map((p: any) => p.id);
    if (idsSegundaMano.length > 0) {
      const { rows: enCurso } = await client.query(
        `SELECT DISTINCT oi.producto_id
         FROM orden_item oi
         JOIN orden o ON o.id = oi.orden_id
         WHERE oi.producto_id = ANY($1::int[])
           AND o.estado = 'pendiente'
           AND o.usr_comprador_id != $2
           AND oi.creado_en > NOW() - INTERVAL '30 minutes'`,
        [idsSegundaMano, auth.user_id]
      );
      if (enCurso.length > 0) {
        await client.query("ROLLBACK");
        const nombres = enCurso.map((r: any) => `"${productoMap.get(Number(r.producto_id)).nombre}"`).join(", ");
        return NextResponse.json(
          {
            error: `Otra persona está completando la compra de ${nombres} en este momento. Inténtalo de nuevo en unos minutos.`,
            en_curso: enCurso.map((r: any) => Number(r.producto_id)),
          },
          { status: 409 }
        );
      }
    }

    let subtotal_articulos = 0;
    let envio_total = 0;
    let gestion_total = 0;
    const lineItems: any[] = [];
    const enrichedItems: any[] = [];
    // Envío que le corresponde a cada producto de segunda mano. Se cobra una
    // sola vez por vendedor: si compro dos cosas al mismo, van en un paquete.
    const envioPorProducto = new Map<number, number>();
    const tamanoPorProducto = new Map<number, string>();
    const vendedoresConEnvio = new Set<number>();

    for (const item of items) {
      const producto = productoMap.get(Number(item.producto_id));
      const descuento = Number(item.descuento ?? 0);
      const precio_unitario = Number(producto.precio);
      const precio_items = (precio_unitario - descuento) * item.cantidad;

      subtotal_articulos += precio_items;
      enrichedItems.push({ ...item, precio_items, descuento });

      if (producto.segunda_mano) {
        // Los gastos de gestión se calculan sobre el precio del artículo y los
        // paga el comprador: al vendedor no se le descuenta nada.
        gestion_total += comisionGestion(precio_items);

        // La tarifa sale del tramo que eligió el vendedor al publicar. Los
        // productos anteriores al cambio no lo tienen y caen al tramo medio.
        const tamano = esTamanoValido(producto.tamano_paquete) ? producto.tamano_paquete : TAMANO_POR_DEFECTO;
        tamanoPorProducto.set(Number(producto.id), tamano);

        const vendedorId = Number(producto.id_vendedor);
        const envio = vendedoresConEnvio.has(vendedorId) ? 0 : tarifaEnvio(tamano);
        vendedoresConEnvio.add(vendedorId);
        envio_total += envio;
        envioPorProducto.set(Number(producto.id), envio);
      }

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: { name: producto.nombre },
          unit_amount: Math.round((precio_unitario - descuento) * 100),
        },
        quantity: item.cantidad,
      });
    }

    // Los productos de la tienda van todos en un mismo paquete que enviamos
    // nosotros: un solo porte por pedido, no uno por artículo.
    const lineasTienda = items
      .map((i: any) => productoMap.get(Number(i.producto_id)))
      .filter((p: any) => p && !p.segunda_mano)
      .map((p: any) => ({
        tamano: p.tamano_paquete,
        precio: Number(p.precio),
        cantidad: items.find((i: any) => Number(i.producto_id) === p.id)?.cantidad ?? 1,
      }));

    if (lineasTienda.length > 0) {
      const envio = envioTienda(lineasTienda);
      envio_total += envio.importe;
    }

    // Conceptos separados, no sumados al precio: así el comprador ve qué paga
    // y la factura de Stripe sale desglosada.
    if (envio_total > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: { name: "Gastos de envío" },
          unit_amount: Math.round(envio_total * 100),
        },
        quantity: 1,
      });
    }
    if (gestion_total > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: { name: "Gastos de gestión y seguridad" },
          unit_amount: Math.round(gestion_total * 100),
        },
        quantity: 1,
      });
    }

    const comision_total = Math.round((envio_total + gestion_total) * 100) / 100;
    const precio_total = Math.round((subtotal_articulos + comision_total) * 100) / 100;

    const { dbId: stripeCustomerDbId, stripeId: stripeCustomerId } = await getOrCreateStripeCustomer(client, auth.user_id ?? 0);

    const { rows: txRows } = await client.query(
      `INSERT INTO transacciones (stripe_customer_id, importe, estado, tipo)
       VALUES ($1, $2, 'pendiente', 'pago')
       RETURNING id`,
      [stripeCustomerDbId, precio_total]
    );
    const transaccion_id = txRows[0].id;

    const { rows: ordenRows } = await client.query(
      `INSERT INTO orden (usr_comprador_id, precio_total, direccion_envio, comision, estado, transaccion_id)
       VALUES ($1, $2, $3, $4, 'pendiente', $5)
       RETURNING id`,
      [auth.user_id, precio_total, direccion_envio.trim(), comision_total, transaccion_id]
    );
    const orden_id = ordenRows[0].id;

    await Promise.all(enrichedItems.map(item =>
      client.query(
        `INSERT INTO orden_item (orden_id, producto_id, cantidad, descuento, precio_items, estado)
         VALUES ($1, $2, $3, $4, $5, 'pendiente')`,
        [orden_id, item.producto_id, item.cantidad, item.descuento, item.precio_items]
      )
    ));

    const stripe = getStripe();
    // Agrupa el cobro con los transfers que saldrán de él cuando se libere el
    // dinero a cada vendedor, aunque eso ocurra semanas después.
    const transferGroup = `orden_${orden_id}`;

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      payment_intent_data: { transfer_group: transferGroup },
      success_url: `${process.env.NEXTAUTH_URL}/api/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/compra-cancelado?orden_id=${orden_id}`,
      // Sin invoice_creation un pago unico solo genera payment intent: Stripe no
      // emite factura y el comprador no tiene nada que descargar despues.
      invoice_creation: {
        enabled: true,
        invoice_data: {
          metadata: {
            orden_id: String(orden_id),
            usuario_id: String(auth.user_id),
          },
        },
      },
      tax_id_collection: { enabled: true },
      customer_update: { name: "auto", address: "auto" },
      metadata: {
        tipo: "orden",
        orden_id: String(orden_id),
        usuario_id: String(auth.user_id),
        transfer_group: transferGroup,
        // Qué parte del envío cobrado le toca a cada producto: el post-venta lo
        // necesita para guardar el desglose real de cada venta, y no puede
        // recalcularlo porque no sabe con qué otros artículos iba agrupado.
        sm_envios: JSON.stringify(Object.fromEntries(envioPorProducto)),
        sm_tamanos: JSON.stringify(Object.fromEntries(tamanoPorProducto)),
      },
    });

    await client.query("COMMIT");

    return NextResponse.json({ ok: true, orden_id, checkout_url: session.url }, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id es obligatorio" }, { status: 400 });

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, transaccion_id, usr_comprador_id, estado FROM orden WHERE id = $1`,
      [Number(id)]
    );
    if (rows.length === 0) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    const orden = rows[0];
    if (orden.usr_comprador_id !== auth.user_id && auth.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    if (orden.estado !== "pendiente") {
      return NextResponse.json({ error: "Solo se pueden cancelar órdenes pendientes" }, { status: 400 });
    }

    await client.query(`DELETE FROM orden_item WHERE orden_id = $1`, [Number(id)]);
    await client.query(`DELETE FROM orden WHERE id = $1`, [Number(id)]);
    if (orden.transaccion_id) {
      await client.query(`DELETE FROM transacciones WHERE id = $1`, [orden.transaccion_id]);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (auth.rol !== "admin") return NextResponse.json({ error: "Acceso restringido" }, { status: 403 });

  const { id, estado } = await req.json();
  if (!id || !estado) return NextResponse.json({ error: "id y estado son obligatorios" }, { status: 400 });

  const client = await pool.connect();
  try {
    const { rowCount } = await client.query(
      `UPDATE orden SET estado = $1 WHERE id = $2`,
      [estado, Number(id)]
    );
    if (rowCount === 0) return NextResponse.json({ error : "Orden no encontrada" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}
