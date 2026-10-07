import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";
import { pusher } from "@/backend/services/pusher";
import { transporter } from "@/backend/services/mailer";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? process.env.SMTP_USER ?? "";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

async function getUsuarioId(req: NextRequest): Promise<number | null> {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return (payload.id as number) ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let body: { id?: number | string; nombre?: string; cantidad?: number };

  try {
    body = await req.json();
  } catch (error) {
    console.error("Error leyendo JSON:", error);
    return NextResponse.json({ ok: false, message: "JSON inválido" }, { status: 400 });
  }

  let id = body.id;
  const nombre   = body.nombre;
  const cantidad = typeof body.cantidad === "number" ? body.cantidad : 1;

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return NextResponse.json({ ok: false, message: "Cantidad inválida" }, { status: 400 });
  }

  if (!id && (!nombre || typeof nombre !== "string")) {
    return NextResponse.json({ ok: false, message: "ID o nombre requeridos" }, { status: 400 });
  }

  const usuarioId = await getUsuarioId(req);
  if (!usuarioId) {
    return NextResponse.json({ ok: false, message: "Debes iniciar sesión para comprar" }, { status: 401 });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    
    if (!id && nombre) {
      const buscar = await client.query(
        "SELECT id FROM productos WHERE nombre = $1 LIMIT 1",
        [nombre]
      );
      if (buscar.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ ok: false, message: "Producto no encontrado" }, { status: 404 });
      }
      id = buscar.rows[0].id;
    }

    
    const producto = await client.query(
      "SELECT id, nombre, stock, segunda_mano FROM productos WHERE id = $1 FOR UPDATE",
      [id]
    );

    if (producto.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ ok: false, message: "Producto no encontrado" }, { status: 404 });
    }

    const stockTotal = Number(producto.rows[0].stock);

    
    const reservaRes = await client.query(
      `SELECT COALESCE(SUM(cantidad), 0) AS reservado
       FROM carrito_items
       WHERE producto_id = $1
         AND expires_at > NOW()
         AND ($2::int IS NULL OR usuario_id != $2)`,
      [id, usuarioId]
    );
    const reservadoOtros = Number(reservaRes.rows[0].reservado);

    
    const disponible = stockTotal - reservadoOtros;

    if (disponible < cantidad) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { ok: false, message: "Sin stock disponible", stock_restante: disponible },
        { status: 409 }
      );
    }

    
    const update = await client.query(
      "UPDATE productos SET stock = stock - $2 WHERE id = $1 RETURNING id, nombre, stock",
      [id, cantidad]
    );

    
    if (usuarioId) {
      await client.query(
        "DELETE FROM carrito_items WHERE usuario_id = $1 AND producto_id = $2",
        [usuarioId, id]
      );
    }

    const esSegundaMano = producto.rows[0].segunda_mano === true;
    const nuevoStock = Number(update.rows[0].stock);

    if (esSegundaMano && nuevoStock === 0) {
      await client.query("DELETE FROM carrito_items WHERE producto_id = $1", [id]);
      await client.query("DELETE FROM producto_specs WHERE producto_id = $1", [id]);
      await client.query("DELETE FROM producto_destacados WHERE producto_id = $1", [id]);
      await client.query("DELETE FROM productos WHERE id = $1", [id]);
      pusher.trigger("segunda-mano", "producto-vendido", { id: Number(id) }).catch(() => {});
    }

    await client.query("COMMIT");

    const productoId = Number(update.rows[0].id);
    const stockRestante = Number(update.rows[0].stock);

    
    const reservaRes2 = await client.query(
      `SELECT COALESCE(SUM(cantidad), 0) AS reservado
       FROM carrito_items WHERE producto_id = $1 AND expires_at > NOW()`,
      [productoId]
    );
    const stockDisponible = Math.max(0, stockRestante - Number(reservaRes2.rows[0].reservado));

    pusher.trigger("stock", "actualizado", {
      producto_id: productoId,
      stock: stockDisponible,
    }).catch(() => {});

    
    if (stockRestante === 0 && ADMIN_EMAIL) {
      const nombreProducto = String(update.rows[0].nombre);
      transporter.sendMail({
        from: `"Relatia55 Tienda" <${process.env.SMTP_USER}>`,
        to: ADMIN_EMAIL,
        subject: `⚠️ Sin stock: ${nombreProducto}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#C0392B;margin:0 0 12px">⚠️ Producto sin stock</h2>
            <p style="color:#333;font-size:15px;margin:0 0 16px">
              El producto <strong>${nombreProducto}</strong> (ID: ${productoId})
              ha agotado su stock tras una compra.
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr style="background:#f5f5f5">
                <td style="padding:8px 12px;font-weight:600">Producto</td>
                <td style="padding:8px 12px">${nombreProducto}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;font-weight:600">ID</td>
                <td style="padding:8px 12px">${productoId}</td>
              </tr>
              <tr style="background:#f5f5f5">
                <td style="padding:8px 12px;font-weight:600">Stock actual</td>
                <td style="padding:8px 12px;color:#C0392B;font-weight:700">0 unidades</td>
              </tr>
            </table>
            <p style="color:#888;font-size:12px;margin:20px 0 0">
              Este aviso se ha generado automáticamente desde Relatia55 el
              ${new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}.
            </p>
          </div>
        `,
      }).catch((err) => console.error("Error enviando email de stock agotado:", err));
    }

    return NextResponse.json({
      ok: true,
      producto_id:     productoId,
      producto_nombre: String(update.rows[0].nombre),
      stock_restante:  stockRestante,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("ERROR EN /api/comprar:", error);
    return NextResponse.json({ ok: false, message: "Error interno del servidor" }, { status: 500 });
  } finally {
    client.release();
  }
}
