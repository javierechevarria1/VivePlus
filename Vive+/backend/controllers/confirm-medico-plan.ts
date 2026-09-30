import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { pool } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "session_id requerido" }, { status: 400 });

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "Sesión de pago no encontrada" }, { status: 404 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Pago no completado" }, { status: 400 });
  }
  if (session.metadata?.type !== "medico") {
    return NextResponse.json({ error: "Tipo de sesión incorrecto" }, { status: 403 });
  }

  const m = session.metadata;
  const customerId = session.customer as string;

  const existing = await pool.query(
    "SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)",
    [m.email]
  );
  if (existing.rows.length > 0) {
    return NextResponse.json({ ok: true, already_exists: true });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `INSERT INTO usuarios (email, edad, username, password, rol, sexo, creado_en, plan_id, stripe_customer_id)
       VALUES ($1, $2, $3, $4, 3, $5, NOW(), $6, $7) RETURNING id`,
      [m.email, Number(m.edad), m.username, m.password_hash, m.sexo || null, m.plan_id || null, customerId]
    );
    const userId = userResult.rows[0].id;

    await client.query(
      "UPDATE codigos_invitacion_medico SET estado = TRUE, usado_por = $2 WHERE codigo = $1",
      [m.codigo_invitacion, userId]
    );

    const hasDocs = !!(m.doc_identidad_url || m.doc_antecedentes_url);
    const medicoResult = await client.query(
      `INSERT INTO medicos (tag, horario, tipo, especialidad, usuario_medico_id, plan_activo, plan_id, stripe_customer_id,
        doc_identidad_url, doc_antecedentes_url, doc_residencia_url, docs_estado, verificado)
       VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7, $8, $9, $10, $11, FALSE) RETURNING id`,
      [
        m.tag, m.horario, m.tipo, m.especialidad, userId, m.plan_id || null, customerId,
        m.doc_identidad_url || null, m.doc_antecedentes_url || null, m.doc_residencia_url || null,
        hasDocs ? "en_revision" : "pendiente",
      ]
    );

    const cantidad = session.amount_total != null ? session.amount_total / 100 : 0;

    await client.query(
      `INSERT INTO medico_pagos (medico_id, cantidad) VALUES ($1, $2)`,
      [medicoResult.rows[0].id, cantidad]
    );

    if (m.plan_id) {
      await client.query(
        `INSERT INTO pagos_planes (plan_id, entidad_id, entidad_tipo, precio) VALUES ($1, $2, 'medico', $3)`,
        [m.plan_id, medicoResult.rows[0].id, cantidad]
      );
    }

    const scResult = await client.query(
      `INSERT INTO stripe_customers (id_stripe, usuario_id, estado) VALUES ($1, $2, 'activo') RETURNING id`,
      [customerId, userId]
    );
    const stripeCustomerDbId = scResult.rows[0].id;

    const planRow = await client.query(`SELECT intervalo FROM planes WHERE id = $1`, [Number(m.plan_id)]);
    const intervalo = planRow.rows[0]?.intervalo ?? "mensual";
    const fechaFin = intervalo === "anual"
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const facturaStripeId =
      typeof session.invoice === "string" ? session.invoice : session.invoice?.id ?? null;

    const txResult = await client.query(
      `INSERT INTO transacciones (stripe_customer_id, importe, fecha, estado, tipo, motivo, factura_id)
       VALUES ($1, $2, NOW(), 'correcto', 'pago', 'Plan médico', $3) RETURNING id`,
      [stripeCustomerDbId, cantidad, facturaStripeId]
    );
    const transaccionId = txResult.rows[0].id;

    await client.query(
      `INSERT INTO suscripcion (usuario_id, estado, fecha_ini, fecha_fin, transaccion_id, plan_id)
       VALUES ($1, 'activo', NOW(), $2, $3, $4)`,
      [userId, fechaFin, transaccionId, m.plan_id || null]
    );

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}
