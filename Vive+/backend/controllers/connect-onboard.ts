import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia" as any,
});

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function requireUser(req: NextRequest) {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return { error: "No autorizado" };
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const user_id = (payload.id ?? payload.medicoId) as number | undefined;
    if (!user_id) return { error: "No autorizado" };
    return { user_id };
  } catch {
    return { error: "Token inválido" };
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { rows } = await pool.query(
    `SELECT stripe_connect_id FROM usuarios WHERE id = $1`,
    [auth.user_id]
  );
  const connectId = rows[0]?.stripe_connect_id;
  if (!connectId) return NextResponse.json({ connected: false });

  try {
    const account = await stripe.accounts.retrieve(connectId);
    // La cuenta solo solicita capability "transfers" (no "card_payments"), así que
    // charges_enabled nunca se activa aquí; payouts_enabled es la señal correcta.
    return NextResponse.json({
      connected: account.payouts_enabled === true,
      account_id: connectId,
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT email, stripe_connect_id FROM usuarios WHERE id = $1`,
      [auth.user_id]
    );
    if (!rows.length) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    let connectId: string = rows[0].stripe_connect_id;

    if (!connectId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: rows[0].email,
        capabilities: { transfers: { requested: true } },
        metadata: { usuario_id: String(auth.user_id) },
      });
      connectId = account.id;
      await client.query(
        `UPDATE usuarios SET stripe_connect_id = $1 WHERE id = $2`,
        [connectId, auth.user_id]
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const accountLink = await stripe.accountLinks.create({
      account: connectId,
      refresh_url: `${baseUrl}/segunda-mano?connect=refresh`,
      return_url: `${baseUrl}/segunda-mano?connect=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } finally {
    client.release();
  }
}
