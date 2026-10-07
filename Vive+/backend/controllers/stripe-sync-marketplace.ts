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
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" as any });
}

function stripeImageUrl(imagen: string | null | undefined): string[] {
  if (!imagen) return [];
  if (imagen.startsWith("http")) return [imagen];
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (base && imagen.startsWith("/")) return [`${base}${imagen}`];
  return [];
}

async function requireAdmin(req: NextRequest): Promise<{ error: NextResponse } | null> {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.rol !== "admin") {
      return { error: NextResponse.json({ error: "Acceso restringido" }, { status: 403 }) };
    }
    return null;
  } catch {
    return { error: NextResponse.json({ error: "Token inválido" }, { status: 401 }) };
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError.error;

  const { rows } = await pool.query(
    `SELECT id, nombre, descripcion, precio, imagen
     FROM productos
     WHERE stripe_producto_id IS NULL AND precio > 0
     ORDER BY id`
  );

  if (!rows.length) {
    return NextResponse.json({ ok: true, sincronizados: 0, mensaje: "Todos los productos ya están en Stripe" });
  }

  const stripe = getStripe();
  let sincronizados = 0;
  const errores: string[] = [];

  for (const row of rows) {
    try {
      const stripeProduct = await stripe.products.create({
        name: row.nombre,
        ...(row.descripcion ? { description: row.descripcion } : {}),
        ...(stripeImageUrl(row.imagen).length ? { images: stripeImageUrl(row.imagen) } : {}),
        metadata: { producto_id: String(row.id) },
      });
      const stripePrice = await stripe.prices.create({
        unit_amount: Math.round(Number(row.precio) * 100),
        currency: "eur",
        product: stripeProduct.id,
      });
      await pool.query(
        `UPDATE productos SET stripe_producto_id = $1, stripe_price_id = $2 WHERE id = $3`,
        [stripeProduct.id, stripePrice.id, row.id]
      );
      sincronizados++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errores.push(`Producto ${row.id} (${row.nombre}): ${msg}`);
    }
  }

  return NextResponse.json({ ok: true, sincronizados, errores });
}
