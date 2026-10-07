import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";
import { transporter } from "@/backend/services/mailer";
import { pusher } from "@/backend/services/pusher";
import { sincronizarEstadoCobro } from "@/backend/services/transferencia-vendedor";
import { esTamanoValido } from "@/backend/services/tarifas-segunda-mano";
import { direccionCompleta } from "@/backend/controllers/direccion-vendedor";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY no configurado");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" as any });
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

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

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.rol !== "admin") {
      return { error: NextResponse.json({ error: "Acceso restringido a administradores" }, { status: 403 }) };
    }
    return { ok: true };
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
        p.id_vendedor,
        p.nombre,
        p.descripcion,
        p.precio AS precio_final,
        p.stock,
        p.imagen,
        p.estado,
        p.tamano_paquete,
        COALESCE(u.username, 'Usuario') AS vendedor_nombre,
        COALESCE(u.stripe_payouts_enabled, false) AS vendedor_puede_cobrar
      FROM productos p
      LEFT JOIN usuarios u ON u.id = p.id_vendedor
      -- Los vendidos ya no se borran: siguen en la tabla hasta que se cierra
      -- la venta, pero no vuelven a aparecer en el catálogo.
      WHERE p.segunda_mano = true AND p.estado = 'disponible'
      ORDER BY p.id DESC
    `);

    const data = result.rows.map(row => {
      let imagenParsed = row.imagen;
      try {
        if (typeof row.imagen === 'string' && row.imagen.startsWith('[')) {
          imagenParsed = JSON.parse(row.imagen);
        }
      } catch {

      }
      return { ...row, imagen: imagenParsed };
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { nombre, descripcion, precio_original, imagen, tamano_paquete } = await req.json();

  if (!nombre || !precio_original) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  // El tramo decide lo que se le cobra al comprador por el envío: sin él no se
  // puede publicar, porque la plataforma acabaría poniendo la diferencia.
  if (!esTamanoValido(tamano_paquete)) {
    return NextResponse.json(
      { error: "Elige el tamaño del paquete para calcular los gastos de envío", code: "TAMANO_REQUERIDO" },
      { status: 400 }
    );
  }

  const precioNum = Number(precio_original);

  const client = await pool.connect();
  try {
    const { rows: vendedor } = await client.query(
      `SELECT stripe_connect_id, direccion, cp, ciudad, telefono FROM usuarios WHERE id = $1`,
      [auth.user_id]
    );

    // Desde esa dirección saldrá el paquete: el comprador la recibe cuando hay
    // venta, y el transportista la necesitará para recoger.
    if (!direccionCompleta(vendedor[0] ?? {})) {
      return NextResponse.json(
        {
          error: "Antes de publicar, indica la dirección desde la que enviarás tus productos",
          code: "DIRECCION_REQUERIDA",
        },
        { status: 400 }
      );
    }
    let stripeInstance: Stripe | undefined;
    try {
      stripeInstance = getStripe();
    } catch {
      stripeInstance = undefined;
    }
    if (!(await sincronizarEstadoCobro(client, auth.user_id!, vendedor[0]?.stripe_connect_id, stripeInstance))) {
      return NextResponse.json(
        {
          error: "Debes conectar tu cuenta bancaria con Stripe antes de poner productos a la venta",
          code: "CONNECT_REQUIRED",
        },
        { status: 403 }
      );
    }

    const result = await client.query(
      `INSERT INTO productos (nombre, descripcion, precio, imagen, segunda_mano, id_vendedor, stock, tamano_paquete)
       VALUES ($1, $2, $3, $4, true, $5, 1, $6) RETURNING id`,
      [nombre, descripcion ?? "", precioNum, JSON.stringify(imagen || ["/img/placeholder.png"]), auth.user_id, tamano_paquete]
    );
    const id = result.rows[0].id;

    // Crear producto y precio en Stripe
    try {
      const stripe = getStripe();
      const imagenes = Array.isArray(imagen) ? imagen : [];
      const primeraImagenHttp = imagenes.find((img: string) => img.startsWith("http"));
      const stripeProduct = await stripe.products.create({
        name: nombre,
        ...(descripcion ? { description: descripcion } : {}),
        ...(primeraImagenHttp ? { images: [primeraImagenHttp] } : {}),
        metadata: { producto_id: String(id), segunda_mano: "true" },
      });
      const stripePrice = await stripe.prices.create({
        unit_amount: Math.round(precioNum * 100),
        currency: "eur",
        product: stripeProduct.id,
      });
      await pool.query(
        `UPDATE productos SET stripe_producto_id = $1, stripe_price_id = $2 WHERE id = $3`,
        [stripeProduct.id, stripePrice.id, id]
      );
    } catch (err) {
      console.error("[segunda-mano POST] Error creando en Stripe:", err);
    }

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { id, nombre, descripcion, precio_original, imagen, tamano_paquete } = await req.json();
  if (!id || !nombre || !precio_original) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }
  // Es también la vía por la que los productos publicados antes del cambio
  // completan su tramo de envío.
  if (!esTamanoValido(tamano_paquete)) {
    return NextResponse.json(
      { error: "Elige el tamaño del paquete para calcular los gastos de envío", code: "TAMANO_REQUERIDO" },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    const check = await client.query(
      `SELECT id_vendedor, estado FROM productos WHERE id = $1 AND segunda_mano = true`,
      [Number(id)]
    );
    if (check.rows.length === 0) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    if (Number(check.rows[0].id_vendedor) !== auth.user_id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    // Ya se ha cobrado: cambiar el precio ahora descuadraría lo que se le
    // liberará al vendedor respecto a lo que pagó el comprador.
    if (check.rows[0].estado !== "disponible") {
      return NextResponse.json({ error: "El producto ya se ha vendido y no puede modificarse" }, { status: 409 });
    }

    const { rows: prev } = await client.query(
      `SELECT precio, stripe_producto_id, stripe_price_id FROM productos WHERE id = $1`,
      [Number(id)]
    );

    await client.query(
      `UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, imagen = $4, tamano_paquete = $5
       WHERE id = $6`,
      [nombre, descripcion ?? "", Number(precio_original), JSON.stringify(imagen || []), tamano_paquete, Number(id)]
    );

    // Sincronizar con Stripe
    try {
      const stripeId = prev[0]?.stripe_producto_id;
      if (stripeId) {
        const stripe = getStripe();
        await stripe.products.update(stripeId, {
          name: nombre,
          ...(descripcion ? { description: descripcion } : {}),
        });
        const precioAnterior = Number(prev[0].precio);
        const precioNuevo = Number(precio_original);
        if (precioNuevo > 0 && precioAnterior !== precioNuevo) {
          const oldPriceId = prev[0].stripe_price_id;
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
      console.error("[segunda-mano PUT] Error actualizando en Stripe:", err);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let payload: { id?: unknown; medicoId?: unknown; rol?: unknown };
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    payload = verified.payload as { id?: unknown; medicoId?: unknown; rol?: unknown };
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const isAdmin = payload.rol === "admin";
  const userId = (payload.id ?? payload.medicoId) as number | undefined;

  const { id, motivo } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta el id del producto" }, { status: 400 });
  if (isAdmin && !motivo?.trim()) {
    return NextResponse.json({ error: "El administrador debe indicar un motivo" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT p.nombre, p.id_vendedor, p.stripe_producto_id, p.estado, u.email, u.username
       FROM productos p
       LEFT JOIN usuarios u ON u.id = p.id_vendedor
       WHERE p.id = $1 AND p.segunda_mano = true`,
      [Number(id)]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const { nombre, id_vendedor, stripe_producto_id, estado, email, username } = result.rows[0];

    if (!isAdmin && Number(id_vendedor) !== Number(userId)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Una venta en curso cuelga de este producto: borrarlo dejaría al comprador
    // sin pedido y al vendedor sin el dinero retenido.
    if (estado !== "disponible") {
      return NextResponse.json(
        { error: "El producto ya se ha vendido: la venta debe cerrarse o reembolsarse antes de retirarlo" },
        { status: 409 }
      );
    }

    await client.query(`DELETE FROM productos WHERE id = $1`, [Number(id)]);

    pusher.trigger("segunda-mano", "producto-vendido", { id: Number(id) }).catch(() => {});

    if (stripe_producto_id) {
      getStripe().products.update(stripe_producto_id, { active: false }).catch(() => {});
    }

    if (isAdmin && email && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter.sendMail({
        from: `"Relatia55" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Tu producto ha sido eliminado — Relatia55`,
        html: `
          <p>Hola <strong>${username ?? "vendedor"}</strong>,</p>
          <p>Tu producto <strong>${nombre}</strong> ha sido eliminado por el administrador de Relatia55.</p>
          <p><strong>Motivo:</strong> ${motivo}</p>
          <p>Si tienes alguna duda, puedes contactar con nosotros.</p>
          <p>— El equipo de Relatia55</p>
        `,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}
