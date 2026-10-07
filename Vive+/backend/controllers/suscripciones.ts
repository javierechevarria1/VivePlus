import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";
import Stripe from "stripe";

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


export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT s.id, s.estado, s.fecha_ini, s.fecha_fin, s.transaccion_id,
              p.id AS plan_id, p.nombre AS plan_nombre, p.precio AS plan_precio, p.intervalo AS plan_intervalo
       FROM suscripcion s
       JOIN usuarios u ON u.id = s.usuario_id
       LEFT JOIN planes p ON p.id = u.plan_id
       WHERE s.usuario_id = $1
       ORDER BY s.fecha_ini DESC
       LIMIT 1`,
      [auth.user_id]
    );
    return NextResponse.json({ ok: true, data: rows[0] ?? null });
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

  const { plan_id } = await req.json();
  if (!plan_id) return NextResponse.json({ error: "plan_id es obligatorio" }, { status: 400 });

  const client = await pool.connect();
  try {
    const { rows: planRows } = await client.query(
      `SELECT id, nombre, stripe_price_id FROM planes WHERE id = $1`,
      [Number(plan_id)]
    );
    if (planRows.length === 0) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    const plan = planRows[0];

    if (!plan.stripe_price_id) {
      return NextResponse.json({ error: "El plan no tiene precio de Stripe configurado" }, { status: 400 });
    }

    const { rows: activeRows } = await client.query(
      `SELECT id FROM suscripcion WHERE usuario_id = $1 AND estado = 'activo' LIMIT 1`,
      [auth.user_id]
    );
    if (activeRows.length > 0) {
      return NextResponse.json({ error: "Ya tienes una suscripción activo" }, { status: 409 });
    }

    const { rows: scRows } = await client.query(
      `SELECT id_stripe FROM stripe_customers WHERE usuario_id = $1 AND estado = 'activo' LIMIT 1`,
      [auth.user_id]
    );

    let stripeCustomerId: string;
    if (scRows.length > 0) {
      stripeCustomerId = scRows[0].id_stripe;
    } else {
      const { rows: userRows } = await client.query(
        `SELECT email FROM usuarios WHERE id = $1`,
        [auth.user_id]
      );
      const stripe = getStripe();
      const customer = await stripe.customers.create({
        email: userRows[0]?.email,
        // Stripe emite la factura en el idioma del cliente: sin esto sale en inglés.
        preferred_locales: ["es-ES"],
        metadata: { usuario_id: String(auth.user_id) },
      });
      stripeCustomerId = customer.id;
      await client.query(
        `INSERT INTO stripe_customers (id_stripe, usuario_id, estado) VALUES ($1, $2, 'activo')`,
        [stripeCustomerId, auth.user_id]
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/planes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/planes`,
      metadata: {
        tipo: "suscripcion",
        plan_id: String(plan_id),
        usuario_id: String(auth.user_id),
      },
    });

    return NextResponse.json({ ok: true, checkout_url: session.url }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}


export async function DELETE(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const client = await pool.connect();
  try {
    const { rows: subRows } = await client.query(
      `SELECT s.id FROM suscripcion s WHERE s.usuario_id = $1 AND s.estado = 'activo' LIMIT 1`,
      [auth.user_id]
    );
    if (subRows.length === 0) {
      return NextResponse.json({ error: "No hay suscripción activo" }, { status: 404 });
    }

    const { rows: scRows } = await client.query(
      `SELECT id_stripe FROM stripe_customers WHERE usuario_id = $1 AND estado = 'activo' LIMIT 1`,
      [auth.user_id]
    );

    if (scRows.length > 0) {
      try {
        const stripe = getStripe();
        const subscriptions = await stripe.subscriptions.list({
          customer: scRows[0].id_stripe,
          status: "active",
          limit: 1,
        });
        if (subscriptions.data.length > 0) {
          await stripe.subscriptions.cancel(subscriptions.data[0].id);
        }
      } catch (e) {
        console.error("[suscripciones] Error cancelando en Stripe:", e);
      }
    }

    await client.query(
      `UPDATE suscripcion SET estado = 'inactivo', fecha_fin = NOW() WHERE id = $1`,
      [subRows[0].id]
    );
    await client.query(`UPDATE usuarios SET plan_id = NULL WHERE id = $1`, [auth.user_id]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}
