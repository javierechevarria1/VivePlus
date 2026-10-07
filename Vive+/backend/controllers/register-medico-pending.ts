import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: NextRequest) {
  try {
    const {
      username, email, password, edad, sexo,
      codigoInvitacion, medicoTag, medicoHorario, medicoTipo, medicoEspecialidad,
      planId, successUrl, cancelUrl,
      docIdentidadUrl, docAntecedentesUrl, docResidenciaUrl,
    } = await req.json();

    if (!username || !email || !password || !edad || !codigoInvitacion || !planId) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return NextResponse.json({ error: "Email no válido" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const codigoRow = await client.query(
        "SELECT id, estado FROM codigos_invitacion_medico WHERE codigo = $1",
        [codigoInvitacion.trim()]
      );
      if (codigoRow.rows.length === 0) {
        return NextResponse.json({ error: "Código de invitación no válido" }, { status: 400 });
      }
      if (codigoRow.rows[0].estado) {
        return NextResponse.json({ error: "Este código de invitación ya ha sido utilizado" }, { status: 400 });
      }

      const emailExists = await client.query(
        "SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)",
        [email.trim()]
      );
      if (emailExists.rows.length > 0) {
        return NextResponse.json({ error: "Ya hay una cuenta registrada con ese email" }, { status: 409 });
      }

      const userExists = await client.query(
        "SELECT id FROM usuarios WHERE username = $1",
        [username.trim()]
      );
      if (userExists.rows.length > 0) {
        return NextResponse.json({ error: "El nombre de usuario ya está en uso" }, { status: 409 });
      }
    } finally {
      client.release();
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const planClient = await pool.connect();
    let plan: { id: string; stripe_price_id: string };
    try {
      const planRow = await planClient.query(
        "SELECT id, stripe_price_id FROM planes WHERE id = $1",
        [planId]
      );
      if (planRow.rows.length === 0) {
        return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
      }
      if (!planRow.rows[0].stripe_price_id) {
        return NextResponse.json({ error: "El plan no está configurado para pagos" }, { status: 400 });
      }
      plan = planRow.rows[0];
    } finally {
      planClient.release();
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl ?? `${process.env.NEXT_PUBLIC_BASE_URL}/?medico_pagado=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl ?? `${process.env.NEXT_PUBLIC_BASE_URL}/?medico_cancelado=true`,
      metadata: {
        type: "medico",
        plan_id: String(plan.id),
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        edad: String(Number(edad)),
        sexo: sexo?.trim() ?? "",
        codigo_invitacion: codigoInvitacion.trim(),
        tag: medicoTag?.trim() ?? "",
        horario: medicoHorario?.trim() ?? "",
        tipo: medicoTipo?.trim().toLowerCase() ?? "",
        especialidad: medicoEspecialidad?.trim() ?? "",
        doc_identidad_url: docIdentidadUrl?.trim() ?? "",
        doc_antecedentes_url: docAntecedentesUrl?.trim() ?? "",
        doc_residencia_url: docResidenciaUrl?.trim() ?? "",
      },
    });

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
  } catch (error: any) {
    console.error("[Registro Médico] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
