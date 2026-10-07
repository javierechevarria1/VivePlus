import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: NextRequest) {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let userId: number;
  let rolNombre: string;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.id) return NextResponse.json({ error: "Token sin usuario" }, { status: 401 });
    userId = payload.id as number;
    rolNombre = payload.rol as string;
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  if (rolNombre !== "usuario_organizacion") {
    return NextResponse.json({ error: "Solo disponible para cuentas de organización" }, { status: 403 });
  }

  const { planId } = await req.json();
  if (!planId) return NextResponse.json({ error: "planId requerido" }, { status: 400 });

  const client = await pool.connect();
  try {
    const orgRes = await client.query(
      `SELECT o.id, o.web, u.username AS nombre, u.foto AS logo_url
       FROM organizaciones o
       JOIN usuarios u ON u.id = o.usuario_organizacion_id
       WHERE o.usuario_organizacion_id = $1 LIMIT 1`,
      [userId]
    );
    if (orgRes.rows.length === 0) {
      return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
    }
    const org = orgRes.rows[0];

    const planRes = await client.query(
      `SELECT id, nombre, precio, stripe_price_id, COALESCE(scope, 'usuario') AS scope
       FROM planes WHERE id = $1`,
      [planId]
    );
    if (planRes.rows.length === 0) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }
    const plan = planRes.rows[0];

    if (plan.scope !== "organizacion") {
      return NextResponse.json({ error: "Plan no disponible para organizaciones" }, { status: 400 });
    }
    if (!plan.stripe_price_id) {
      return NextResponse.json({ error: "Este plan aún no está configurado para pagos. Contacta con el administrador." }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const returnUrl = `${baseUrl}/planes-organizacion?session_id={CHECKOUT_SESSION_ID}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      mode: "subscription",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      metadata: {
        type: "organizacion",
        organizacion_id: String(org.id),
        plan_id: String(plan.id),
        plan_nombre: plan.nombre,
        org_web: org.web ?? "",
        org_logo: org.logo_url ?? "",
        org_nombre: org.nombre ?? "",
      },
      subscription_data: {
        metadata: {
          type: "organizacion",
          organizacion_id: String(org.id),
          plan_id: String(plan.id),
          plan_nombre: plan.nombre,
        },
      },
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } finally {
    client.release();
  }
}
