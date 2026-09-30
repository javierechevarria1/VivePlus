import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "session_id requerido" }, { status: 400 });

  const token = req.cookies.get("r65_token")?.value;
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let userId: number;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.id) return NextResponse.json({ error: "Token sin usuario" }, { status: 401 });
    userId = payload.id as number;
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "Sesión de pago no encontrada" }, { status: 404 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Pago no completado" }, { status: 400 });
  }

  if (session.metadata?.type !== "subscription" || String(session.metadata.userId) !== String(userId)) {
    return NextResponse.json({ error: "Sesión no corresponde al usuario" }, { status: 403 });
  }

  const planId = session.metadata.planId;
  if (!planId) return NextResponse.json({ error: "Plan no encontrado en sesión" }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE usuarios SET plan_id = $1, stripe_customer_id = $2 WHERE id = $3`,
      [planId, session.customer, userId]
    );

    const existingCustomer = await client.query(
      `SELECT id FROM stripe_customers WHERE usuario_id = $1 AND estado = 'activo' LIMIT 1`,
      [userId]
    );
    let stripeCustomerDbId: number;
    if (existingCustomer.rows.length === 0) {
      const scResult = await client.query(
        `INSERT INTO stripe_customers (id_stripe, usuario_id, estado) VALUES ($1, $2, 'activo') RETURNING id`,
        [session.customer, userId]
      );
      stripeCustomerDbId = scResult.rows[0].id;
    } else {
      stripeCustomerDbId = existingCustomer.rows[0].id;
    }

    const planRow = await client.query(`SELECT intervalo FROM planes WHERE id = $1`, [planId]);
    const intervalo = planRow.rows[0]?.intervalo ?? "mensual";
    const fechaFin = intervalo === "anual"
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const activeSub = await client.query(
      `SELECT id FROM suscripcion WHERE usuario_id = $1 AND estado = 'activo' LIMIT 1`,
      [userId]
    );
    if (activeSub.rows.length === 0) {
      const importe = session.amount_total != null ? session.amount_total / 100 : 0;
      const facturaStripeId =
        typeof session.invoice === "string" ? session.invoice : session.invoice?.id ?? null;
      let transaccionId: number | null = null;
      try {
        const txResult = await client.query(
          `INSERT INTO transacciones (stripe_customer_id, importe, fecha, estado, tipo, motivo, factura_id)
           VALUES ($1, $2, NOW(), 'correcto', 'pago', 'Plan suscripción', $3) RETURNING id`,
          [stripeCustomerDbId, importe, facturaStripeId]
        );
        transaccionId = txResult.rows[0].id;
      } catch (e) {
        console.error("[confirm-plan] Error insertando transaccion:", e instanceof Error ? e.message : e);
      }
      try {
        await client.query(
          `INSERT INTO suscripcion (usuario_id, estado, fecha_ini, fecha_fin, transaccion_id, plan_id)
           VALUES ($1, 'activo', NOW(), $2, $3, $4)`,
          [userId, fechaFin, transaccionId, planId]
        );
      } catch (e) {
        console.error("[confirm-plan] Error insertando suscripcion:", e instanceof Error ? e.message : e);
      }
    }

    return NextResponse.json({ ok: true, plan_id: planId });
  } finally {
    client.release();
  }
}
