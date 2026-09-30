import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2026-03-25.dahlia" });

export async function POST(req: NextRequest) {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let payload: Record<string, unknown>;
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    payload = verified.payload as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  if (payload.rol !== "medico") {
    return NextResponse.json({ error: "Solo médicos pueden acceder" }, { status: 403 });
  }

  const { planId } = await req.json();
  if (!planId) return NextResponse.json({ error: "planId requerido" }, { status: 400 });

  const client = await pool.connect();
  try {
    let medicoRow: Record<string, unknown> | null = null;

    if (payload.medicoId) {
      const r = await client.query(
        `SELECT id, COALESCE(docs_estado,'pendiente') AS docs_estado, COALESCE(plan_activo,FALSE) AS plan_activo
         FROM medicos WHERE id = $1`,
        [payload.medicoId]
      );
      medicoRow = r.rows[0] ?? null;
    } else if (payload.id) {
      const r = await client.query(
        `SELECT id, COALESCE(docs_estado,'pendiente') AS docs_estado, COALESCE(plan_activo,FALSE) AS plan_activo
         FROM medicos WHERE usuario_medico_id = $1`,
        [payload.id]
      );
      medicoRow = r.rows[0] ?? null;
    }

    if (!medicoRow) return NextResponse.json({ error: "Médico no encontrado" }, { status: 404 });
    if (medicoRow.docs_estado !== "aprobado") {
      return NextResponse.json({ error: "Documentación no aprobada" }, { status: 403 });
    }
    if (medicoRow.plan_activo) {
      return NextResponse.json({ error: "El plan ya está activo" }, { status: 409 });
    }

    const planRes = await client.query("SELECT * FROM planes WHERE id = $1", [planId]);
    if (planRes.rows.length === 0) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    const plan = planRes.rows[0];
    if (!plan.stripe_price_id) return NextResponse.json({ error: "Plan sin precio configurado" }, { status: 400 });

    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      mode: plan.intervalo ? "subscription" : "payment",
      success_url: `${base}/panel-cuidador?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/panel-cuidador`,
      metadata: {
        medicoId: String(medicoRow.id),
        planId: String(planId),
        type: "medico_plan",
      },
    });

    return NextResponse.json({ url: session.url });
  } finally {
    client.release();
  }
}
