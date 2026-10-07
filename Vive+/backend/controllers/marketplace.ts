import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";
import Stripe from "stripe";

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

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

async function requireAdmin(req: NextRequest): Promise<{ error: NextResponse } | { rol: string; userId: number }> {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const rol = payload.rol as string | undefined;
    if (rol !== "admin") {
      return { error: NextResponse.json({ error: "Acceso restringido a administradores" }, { status: 403 }) };
    }
    return { rol, userId: payload.id as number };
  } catch {
    return { error: NextResponse.json({ error: "Token inválido" }, { status: 401 }) };
  }
}

export async function GET() {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT
        p.id,
        p.nombre,
        p.descripcion,
        p.precio,
        p.productos_categoria_id,
        COALESCE(cp.nombre, '') AS categoria,
        p.imagen,
        p.stripe_price_id,
        p.stripe_producto_id,
        p.tamano_paquete,
        GREATEST(0, p.stock - COALESCE((
          SELECT SUM(ci.cantidad)
          FROM carrito_items ci
          WHERE ci.producto_id = p.id AND ci.expires_at > NOW()
        ), 0)) AS stock,
        COALESCE(
          (SELECT json_agg(json_build_object('label', s.etiqueta, 'value', s.valor) ORDER BY s.id)
           FROM producto_specs s WHERE s.producto_id = p.id),
          '[]'::json
        ) AS specs,
        COALESCE(
          (SELECT json_agg(d.texto ORDER BY d.id)
           FROM producto_destacados d WHERE d.producto_id = p.id),
          '[]'::json
        ) AS destacados
      FROM productos p
      LEFT JOIN categorias_productos cp ON cp.id = p.productos_categoria_id
      WHERE (p.segunda_mano = false OR p.segunda_mano IS NULL)
        AND (p.es_tecnologia = false OR p.es_tecnologia IS NULL)
      ORDER BY p.id
    `);

    const productos = result.rows.map((row) => ({
      id: Number(row.id),
      nombre: String(row.nombre),
      descripcion: row.descripcion ? String(row.descripcion) : "",
      precio: row.precio != null ? `€${Number(row.precio).toFixed(2)}` : "€0.00",
      productos_categoria_id: row.productos_categoria_id != null ? Number(row.productos_categoria_id) : null,
      categoria: row.categoria ? String(row.categoria) : "",
      imagen: row.imagen ? String(row.imagen) : "",
      stock: Number(row.stock ?? 0),
      stripe_price_id: row.stripe_price_id ? String(row.stripe_price_id) : null,
      stripe_producto_id: row.stripe_producto_id ? String(row.stripe_producto_id) : null,
      tamano_paquete: row.tamano_paquete ? String(row.tamano_paquete) : null,
      specs: Array.isArray(row.specs) ? row.specs : [],
      destacados: Array.isArray(row.destacados) ? row.destacados : [],
    }));

    return NextResponse.json(productos);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("/api/productos error:", msg);

    return NextResponse.json(
      { ok: false, message: msg },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { nombre, descripcion, precio, productos_categoria_id, imagen, stock, tamano_paquete, stripe_price_id, stripe_producto_id, specs, destacados } = body;

  if (!nombre?.trim() || precio == null) {
    return NextResponse.json({ error: "nombre y precio son obligatorios" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO productos (nombre, descripcion, precio, productos_categoria_id, imagen, stock, tamano_paquete, stripe_price_id, stripe_producto_id, id_vendedor, segunda_mano)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)
       RETURNING id`,
      [nombre.trim(), descripcion ?? "", Number(precio), productos_categoria_id ?? null, imagen ?? "", Number(stock ?? 0), tamano_paquete ?? 'M', stripe_price_id ?? null, stripe_producto_id ?? null, auth.userId]
    );
    const id = result.rows[0].id;

    if (Array.isArray(specs) && specs.length > 0) {
      await Promise.all(specs.map(s =>
        client.query(
          `INSERT INTO producto_specs (producto_id, etiqueta, valor) VALUES ($1, $2, $3)`,
          [id, s.label ?? "", s.value ?? ""]
        )
      ));
    }
    if (Array.isArray(destacados) && destacados.length > 0) {
      await Promise.all(destacados.map(texto =>
        client.query(
          `INSERT INTO producto_destacados (producto_id, texto) VALUES ($1, $2)`,
          [id, texto]
        )
      ));
    }
    await client.query("COMMIT");

    // Crear producto y precio en Stripe (sin bloquear la respuesta si falla)
    try {
      const stripe = getStripe();
      const stripeProduct = await stripe.products.create({
        name: nombre.trim(),
        ...(descripcion ? { description: descripcion } : {}),
        ...(stripeImageUrl(imagen).length ? { images: stripeImageUrl(imagen) } : {}),
        metadata: { producto_id: String(id) },
      });
      const stripePrice = await stripe.prices.create({
        unit_amount: Math.round(Number(precio) * 100),
        currency: "eur",
        product: stripeProduct.id,
      });
      await pool.query(
        `UPDATE productos SET stripe_producto_id = $1, stripe_price_id = $2 WHERE id = $3`,
        [stripeProduct.id, stripePrice.id, id]
      );
    } catch (err) {
      console.error("[productos POST] Error creando en Stripe:", err);
    }

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
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
  const { id, nombre, descripcion, precio, productos_categoria_id, imagen, stock, tamano_paquete, stripe_price_id, stripe_producto_id, specs, destacados } = body;

  if (!id) {
    return NextResponse.json({ error: "id es obligatorio" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const { rows: current } = await client.query(
      `SELECT precio, stripe_producto_id, stripe_price_id FROM productos WHERE id = $1`,
      [Number(id)]
    );
    if (!current.length) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    const prev = current[0];

    await client.query("BEGIN");
    await client.query(
      `UPDATE productos
       SET nombre = $1, descripcion = $2, precio = $3, productos_categoria_id = $4,
           imagen = $5, stock = $6, stripe_price_id = $7, stripe_producto_id = $8, tamano_paquete = $9
       WHERE id = $10`,
      [nombre?.trim() ?? "", descripcion ?? "", Number(precio ?? 0), productos_categoria_id ?? null, imagen ?? "", Number(stock ?? 0), stripe_price_id ?? null, stripe_producto_id ?? null, tamano_paquete ?? 'M', Number(id)]
    );

    if (Array.isArray(specs)) {
      await client.query(`DELETE FROM producto_specs WHERE producto_id = $1`, [Number(id)]);
      await Promise.all(specs.map(s =>
        client.query(
          `INSERT INTO producto_specs (producto_id, etiqueta, valor) VALUES ($1, $2, $3)`,
          [Number(id), s.label ?? "", s.value ?? ""]
        )
      ));
    }
    if (Array.isArray(destacados)) {
      await client.query(`DELETE FROM producto_destacados WHERE producto_id = $1`, [Number(id)]);
      await Promise.all(destacados.map(texto =>
        client.query(
          `INSERT INTO producto_destacados (producto_id, texto) VALUES ($1, $2)`,
          [Number(id), texto]
        )
      ));
    }
    await client.query("COMMIT");

    // Sincronizar con Stripe si tiene producto creado
    try {
      const stripeId = prev.stripe_producto_id ?? stripe_producto_id;
      if (stripeId) {
        const stripe = getStripe();
        const imgUrls = stripeImageUrl(imagen);
        await stripe.products.update(stripeId, {
          name: nombre?.trim() ?? "",
          ...(descripcion ? { description: descripcion } : {}),
          ...(imgUrls.length ? { images: imgUrls } : {}),
        });
        // Si cambió el precio: archivar el anterior y crear uno nuevo
        const precioAnterior = Number(prev.precio);
        const precioNuevo = Number(precio ?? 0);
        if (precioNuevo > 0 && precioAnterior !== precioNuevo) {
          const oldPriceId = prev.stripe_price_id ?? stripe_price_id;
          if (oldPriceId) {
            await stripe.prices.update(oldPriceId, { active: false }).catch(() => {});
          }
          const newPrice = await stripe.prices.create({
            unit_amount: Math.round(precioNuevo * 100),
            currency: "eur",
            product: stripeId,
          });
          await pool.query(
            `UPDATE productos SET stripe_price_id = $1 WHERE id = $2`,
            [newPrice.id, Number(id)]
          );
        }
      }
    } catch (err) {
      console.error("[productos PUT] Error actualizando en Stripe:", err);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
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

  if (!id) {
    return NextResponse.json({ error: "id es obligatorio" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT stripe_producto_id, stripe_price_id FROM productos WHERE id = $1`,
      [Number(id)]
    );
    await client.query("DELETE FROM productos WHERE id = $1", [Number(id)]);

    if (rows.length && rows[0].stripe_producto_id) {
      try {
        const stripe = getStripe();
        if (rows[0].stripe_price_id) {
          await stripe.prices.update(rows[0].stripe_price_id, { active: false }).catch(() => {});
        }
        await stripe.products.update(rows[0].stripe_producto_id, { active: false }).catch(() => {});
      } catch (err) {
        console.error("[productos DELETE] Error archivando en Stripe:", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  } finally {
    client.release();
  }
}
