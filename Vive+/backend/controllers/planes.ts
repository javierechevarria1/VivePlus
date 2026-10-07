import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY no configurado");
  return new Stripe(key, { apiVersion: "2023-10-16" as any });
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

function getStripeInterval(intervalo: string): "month" | "year" | null {
  const normalized = (intervalo || "").toLowerCase();
  if (normalized.includes("mes") || normalized === "mensual") return "month";
  if (normalized.includes("año") || normalized === "anual") return "year";
  return null;
}

async function requireAdmin(req: NextRequest): Promise<{ error: NextResponse } | { rol: string }> {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.rol !== "admin") {
      return { error: NextResponse.json({ error: "Acceso restringido a administradores" }, { status: 403 }) };
    }
    return { rol: payload.rol as string };
  } catch {
    return { error: NextResponse.json({ error: "Token inválido" }, { status: 401 }) };
  }
}

export async function GET() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT id, nombre, precio, intervalo, caracteristicas, stripe_price_id, COALESCE(scope, 'usuario') AS scope, creado_en FROM planes ORDER BY precio ASC"
    );
    return NextResponse.json(rows);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { nombre, precio, intervalo, caracteristicas, stripe_price_id } = body;

  if (!nombre?.trim() || precio == null || !intervalo?.trim()) {
    return NextResponse.json({ error: "nombre, precio e intervalo son obligatorios" }, { status: 400 });
  }

  let finalStripePriceId = stripe_price_id?.trim() || null;
  const numPrecio = Number(precio);

  if (numPrecio > 0 && !finalStripePriceId) {
    const stripeInterval = getStripeInterval(intervalo);
    if (stripeInterval) {
      try {
        const stripe = getStripe();
        const product = await stripe.products.create({ name: nombre.trim() });
        const price = await stripe.prices.create({
          unit_amount: Math.round(numPrecio * 100),
          currency: "eur",
          recurring: { interval: stripeInterval },
          product: product.id,
        });
        finalStripePriceId = price.id;
      } catch (err) {
        console.error("Error creando precio en Stripe:", err);
      }
    }
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `INSERT INTO planes (nombre, precio, intervalo, caracteristicas, stripe_price_id)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       RETURNING id`,
      [
        nombre.trim(),
        numPrecio,
        intervalo.trim(),
        caracteristicas ? JSON.stringify(caracteristicas) : null,
        finalStripePriceId,
      ]
    );
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { id, nombre, precio, intervalo, caracteristicas, stripe_price_id } = body;

  if (!id) return NextResponse.json({ error: "id es obligatorio" }, { status: 400 });

  const client = await pool.connect();
  try {
    const { rows: existingRows } = await client.query("SELECT * FROM planes WHERE id = $1", [id]);
    if (existingRows.length === 0) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }
    const existingPlan = existingRows[0];
    
    let finalStripePriceId = stripe_price_id?.trim() || existingPlan.stripe_price_id;
    const numPrecio = Number(precio ?? existingPlan.precio);
    const newNombre = nombre?.trim() ?? existingPlan.nombre;
    const newIntervalo = intervalo?.trim() ?? existingPlan.intervalo;


    if (numPrecio > 0 && (numPrecio !== Number(existingPlan.precio) || newIntervalo !== existingPlan.intervalo)) {
      const stripeInterval = getStripeInterval(newIntervalo);
      
      if (stripeInterval) {
        let productId: string | undefined;


        if (existingPlan.stripe_price_id) {
          try {
            const stripe = getStripe();
            const oldPrice = await stripe.prices.retrieve(existingPlan.stripe_price_id);
            productId = oldPrice.product as string;
          } catch (e) {
            console.error("No se pudo obtener el precio antiguo de Stripe", e);
          }
        }


        if (!productId) {
          try {
            const stripe = getStripe();
            const product = await stripe.products.create({ name: newNombre });
            productId = product.id;
          } catch (err) {
            console.error("Error creando producto en Stripe:", err);
          }
        }

        if (productId) {
          try {
            const stripe = getStripe();
            const newPrice = await stripe.prices.create({
              unit_amount: Math.round(numPrecio * 100),
              currency: "eur",
              recurring: { interval: stripeInterval },
              product: productId,
            });
            finalStripePriceId = newPrice.id;
          } catch (err) {
             console.error("Error creando precio en Stripe:", err);
          }
        }
      }
    } else if (numPrecio === 0) {
      finalStripePriceId = null;
    }

    await client.query(
      `UPDATE planes
       SET nombre = $1, precio = $2, intervalo = $3, caracteristicas = $4::jsonb, stripe_price_id = $5
       WHERE id = $6`,
      [
        newNombre,
        numPrecio,
        newIntervalo,
        caracteristicas !== undefined ? JSON.stringify(caracteristicas) : JSON.stringify(existingPlan.caracteristicas ?? []),
        finalStripePriceId,
        id,
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id es obligatorio" }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("DELETE FROM planes WHERE id = $1", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  } finally {
    client.release();
  }
}
