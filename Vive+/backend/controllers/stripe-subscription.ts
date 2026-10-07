import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: NextRequest) {
  try {
    const { planId, successUrl, cancelUrl } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: "Plan ID missing" }, { status: 400 });
    }

    const token = req.cookies.get("r65_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let userId;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userId = payload.id;
    } catch (err) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Usuario no encontrado en el token" }, { status: 401 });
    }

    const client = await pool.connect();
    let plan;
    try {
      const res = await client.query("SELECT * FROM planes WHERE id = $1", [planId]);
      if (res.rows.length === 0) {
        return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
      }
      plan = res.rows[0];
    } finally {
      client.release();
    }

    if (!plan.stripe_price_id) {
      return NextResponse.json({ error: "El plan no está configurado para pagos" }, { status: 400 });
    }


    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/planes?session_id={CHECKOUT_SESSION_ID}`;
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      metadata: {
        userId: userId.toString(),
        planId: planId,
        type: "subscription"
      }
    });

    return NextResponse.json({ clientSecret: checkoutSession.client_secret }, { status: 200 });
  } catch (error: any) {
    console.error("[Stripe Subscription] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}