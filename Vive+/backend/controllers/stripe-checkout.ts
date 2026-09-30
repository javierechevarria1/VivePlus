import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { jwtVerify } from "jose";
import { pool } from "@/lib/db";
import { comisionGestion, esTamanoValido, tarifaEnvio, TAMANO_POR_DEFECTO } from "@/backend/services/tarifas-segunda-mano";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

async function getUsuarioId(req: NextRequest): Promise<number | null> {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return (payload.id as number) ?? null;
  } catch {
    return null;
  }
}

function parsePrecio(precioStr: string): number {
  return parseFloat(precioStr.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
}

async function getOrCreateStripeCustomer(
  client: any,
  usuarioId: number
): Promise<{ dbId: number; stripeId: string } | null> {
  const { rows } = await client.query(
    `SELECT id, id_stripe FROM stripe_customers WHERE usuario_id = $1 AND estado = 'activo' LIMIT 1`,
    [usuarioId]
  );
  if (rows.length > 0) return { dbId: rows[0].id, stripeId: rows[0].id_stripe };

  const { rows: userRows } = await client.query(
    `SELECT email FROM usuarios WHERE id = $1`,
    [usuarioId]
  );
  if (!userRows.length) return null;

  const customer = await stripe.customers.create({
    email: userRows[0].email,
    // Stripe emite la factura en el idioma del cliente: sin esto sale en inglés.
    preferred_locales: ["es-ES"],
    metadata: { usuario_id: String(usuarioId) },
  });

  const { rows: inserted } = await client.query(
    `INSERT INTO stripe_customers (id_stripe, usuario_id, estado) VALUES ($1, $2, 'activo') RETURNING id`,
    [customer.id, usuarioId]
  );

  return { dbId: inserted[0].id, stripeId: customer.id };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, shippingData } = body;

    if (!items || !items.length) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }

    const usuarioId = await getUsuarioId(req);

    if (!usuarioId) {
      return NextResponse.json({ error: "Debes iniciar sesión para comprar" }, { status: 401 });
    }

    const idsSegundaMano: number[] = (items as { id?: number | string; categoria?: string }[])
      .filter(i => i.categoria === "Segunda Mano" && i.id)
      .map(i => Number(i.id));

    // Los datos de segunda mano nunca salen del carrito: el precio, el vendedor
    // y la disponibilidad se leen de la base de datos, porque lo que manda el
    // cliente es manipulable y aquí se decide cuánto se cobra.
    const productosSM = new Map<number, { nombre: string; precio: number; id_vendedor: number; tamano: string | null }>();

    if (idsSegundaMano.length > 0) {
      const { rows } = await pool.query<{
        id: number; nombre: string; precio: string; id_vendedor: number;
        estado: string; puede_cobrar: boolean; tamano_paquete: string | null;
      }>(
        `SELECT p.id, p.nombre, p.precio, p.id_vendedor, p.estado, p.tamano_paquete,
                COALESCE(u.stripe_payouts_enabled, false) AS puede_cobrar
         FROM productos p
         LEFT JOIN usuarios u ON u.id = p.id_vendedor
         WHERE p.id = ANY($1::int[]) AND p.segunda_mano = true`,
        [idsSegundaMano]
      );

      const vendidos = rows.filter(r => r.estado !== "disponible");
      if (vendidos.length > 0) {
        return NextResponse.json(
          {
            error: `"${vendidos[0].nombre}" ya se ha vendido. Retíralo del carrito para continuar.`,
            code: "PRODUCTO_VENDIDO",
            productos: vendidos.map(v => v.id),
          },
          { status: 409 }
        );
      }

      const bloqueados = rows.filter(r => !r.puede_cobrar);
      if (bloqueados.length > 0) {
        return NextResponse.json(
          {
            error: `El vendedor de "${bloqueados[0].nombre}" no tiene la cuenta bancaria lista para recibir pagos. Retira el producto del carrito para continuar.`,
            code: "VENDEDOR_SIN_COBRO",
            productos: bloqueados.map(b => b.id),
          },
          { status: 409 }
        );
      }

      for (const row of rows) {
        productosSM.set(row.id, {
          nombre: row.nombre,
          precio: Number(row.precio),
          id_vendedor: Number(row.id_vendedor),
          tamano: row.tamano_paquete,
        });
      }
    }

    let envioTotal = 0;
    let gestionTotal = 0;
    // Cuánto envío le toca a cada producto: uno por vendedor, no uno por artículo.
    const envioPorProducto = new Map<number, number>();
    const tamanoPorProducto = new Map<number, string>();
    const vendedoresConEnvio = new Set<number>();

    const line_items = items.map((item: any) => {
      const productoSM = item.id ? productosSM.get(Number(item.id)) : undefined;

      if (productoSM) {
        const cantidad = item.cantidad ?? 1;
        gestionTotal += comisionGestion(productoSM.precio * cantidad);

        const tamano = esTamanoValido(productoSM.tamano) ? productoSM.tamano : TAMANO_POR_DEFECTO;
        tamanoPorProducto.set(Number(item.id), tamano);

        const envio = vendedoresConEnvio.has(productoSM.id_vendedor) ? 0 : tarifaEnvio(tamano);
        vendedoresConEnvio.add(productoSM.id_vendedor);
        envioTotal += envio;
        envioPorProducto.set(Number(item.id), envio);

        return {
          price_data: {
            currency: "eur",
            product_data: { name: productoSM.nombre, description: "Segunda Mano" },
            unit_amount: Math.round(productoSM.precio * 100),
          },
          quantity: cantidad,
        };
      }

      if (item.stripe_price_id) {
        return { price: item.stripe_price_id, quantity: item.cantidad ?? 1 };
      }
      const unitAmount = Math.round(parsePrecio(item.precio) * 100);
      const productData: any = { name: item.nombre, description: item.categoria || "Producto" };
      if (item.imagen && item.imagen.startsWith("http")) productData.images = [item.imagen];
      return { price_data: { currency: "eur", product_data: productData, unit_amount: unitAmount }, quantity: item.cantidad };
    });

    // Separados del precio del artículo para que la factura salga desglosada.
    if (envioTotal > 0) {
      line_items.push({
        price_data: {
          currency: "eur",
          product_data: { name: "Gastos de envío" },
          unit_amount: Math.round(envioTotal * 100),
        },
        quantity: 1,
      });
    }
    if (gestionTotal > 0) {
      line_items.push({
        price_data: {
          currency: "eur",
          product_data: { name: "Gastos de gestión y seguridad" },
          unit_amount: Math.round(gestionTotal * 100),
        },
        quantity: 1,
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const metadataItemsConPrecio = items.map((i: any) => {
      const productoSM = i.id ? productosSM.get(Number(i.id)) : undefined;
      return {
        id: i.id,
        nombre: productoSM?.nombre ?? i.nombre,
        categoria: i.categoria,
        cantidad: i.cantidad ?? 1,
        precio: productoSM?.precio ?? parsePrecio(i.precio),
      };
    });

    let stripeId: string | null = null;

    if (usuarioId) {
      try {
        const client = await pool.connect();
        try {
          const customerData = await getOrCreateStripeCustomer(client, usuarioId);
          if (customerData) stripeId = customerData.stripeId;
        } finally {
          client.release();
        }
      } catch (err) {
        console.error("[stripe-checkout] Error obteniendo stripe customer:", err);
      }
    }

    const direccionEnvio = shippingData
      ? [shippingData.direccion, shippingData.cp].filter(Boolean).join(", ")
      : "";

    const transferGroup = idsSegundaMano.length > 0
      ? `checkout_${Date.now()}_${usuarioId}`
      : null;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${baseUrl}/api/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/marketplace?canceled=true`,
      // Igual que en /api/ordenes: sin esto el pago no genera factura descargable.
      // Aquí el pedido se crea después, en el webhook, que es quien la vincula.
      invoice_creation: {
        enabled: true,
        invoice_data: {
          metadata: usuarioId ? { usuario_id: String(usuarioId) } : {},
        },
      },
      tax_id_collection: { enabled: true },
      // Ata el cobro a los transfers que saldrán de él al liberar el dinero.
      ...(transferGroup ? { payment_intent_data: { transfer_group: transferGroup } } : {}),
      metadata: {
        items_data: JSON.stringify(metadataItemsConPrecio),
        direccion_envio: direccionEnvio,
        sm_envios: JSON.stringify(Object.fromEntries(envioPorProducto)),
        sm_tamanos: JSON.stringify(Object.fromEntries(tamanoPorProducto)),
        ...(transferGroup ? { transfer_group: transferGroup } : {}),
        shipping_name: `${shippingData?.nombre ?? ""} ${shippingData?.apellidos ?? ""}`,
        shipping_email: shippingData?.email ?? "",
        shipping_phone: shippingData?.telefono ?? "",
        ...(usuarioId ? { usuario_id: String(usuarioId) } : {}),
      },
    };

    if (stripeId) {
      sessionParams.customer = stripeId;
      // Stripe exige poder actualizar el customer para guardar el NIF y la
      // dirección fiscal que recoge tax_id_collection.
      sessionParams.customer_update = { name: "auto", address: "auto" };
    } else {
      sessionParams.customer_email = shippingData?.email;
      sessionParams.client_reference_id = usuarioId ? String(usuarioId) : undefined;
    }

    const session = await stripe.checkout.sessions.create({
      ...sessionParams,
      expand: ["payment_intent"],
    });
    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error("Error Stripe Checkout:", error);
    return NextResponse.json({ error: error.message || "Error al procesar el pago" }, { status: 500 });
  }
}
