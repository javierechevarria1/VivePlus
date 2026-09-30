import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import { pool } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2026-03-25.dahlia" });
const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "session_id requerido" }, { status: 400 });

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Pago no completado" }, { status: 400 });
  }
  if (session.metadata?.type !== "medico_plan") {
    return NextResponse.json({ error: "Tipo de sesión incorrecto" }, { status: 403 });
  }

  const medicoId       = session.metadata.medicoId;
  const planId         = session.metadata.planId || null;
  const stripeCustomer = session.customer as string | null;
  const cantidad       = session.amount_total != null ? session.amount_total / 100 : 0;

  const client = await pool.connect();
  try {
    // UPDATE crítico en su propia transacción
    await client.query("BEGIN");
    const medicoRes = await client.query(
      `UPDATE medicos
       SET plan_activo = TRUE,
           verificado = TRUE,
           plan_id = $2,
           stripe_customer_id = $3
       WHERE id = $1
       RETURNING usuario_medico_id`,
      [medicoId, planId, stripeCustomer]
    );
    const usuarioMedicoId = medicoRes.rows[0]?.usuario_medico_id ?? null;
    if (usuarioMedicoId && planId) {
      await client.query(
        `UPDATE usuarios SET plan_id = $1 WHERE id = $2`,
        [planId, usuarioMedicoId]
      );
    }
    await client.query("COMMIT");

    // INSERT secundario fuera de la transacción — si falla no bloquea nada
    try {
      await client.query(
        `INSERT INTO medico_pagos (medico_id, cantidad) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [medicoId, cantidad]
      );
    } catch { /* tabla puede no existir, no es crítico */ }

    // Reemitir el token con plan_activo:true para que el middleware deje de bloquear al médico
    let token: string | null = null;
    if (usuarioMedicoId) {
      const usuarioRes = await client.query(
        `SELECT username, email, session_id FROM usuarios WHERE id = $1`,
        [usuarioMedicoId]
      );
      const usuario = usuarioRes.rows[0];
      if (usuario) {
        token = jwt.sign(
          { id: usuarioMedicoId, email: usuario.email, username: usuario.username, rol: "medico", session_id: usuario.session_id, plan_id: planId ? Number(planId) : null, plan_activo: true },
          JWT_SECRET,
          { expiresIn: "7d" }
        );
      }
    }

    const res = NextResponse.json({ ok: true, token });
    if (token) setSessionCookie(res, token);
    return res;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[confirmar-pago-medico]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}
