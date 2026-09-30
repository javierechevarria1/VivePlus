import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";
import { PoolClient } from "pg";
import { pusher } from "@/backend/services/pusher";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

const GUEST_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getOwnerKey(req: NextRequest): Promise<{ key: string; usuarioId: number | null } | null> {
  const token = req.cookies.get("r65_token")?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const id = payload.id as number;
      if (id) return { key: `u:${id}`, usuarioId: id };
    } catch {}
  }
  const guest = req.cookies.get("r65_guest")?.value;
  if (guest && GUEST_UUID_RE.test(guest)) return { key: `g:${guest}`, usuarioId: null };
  return null;
}


async function limpiarExpirados(client: PoolClient): Promise<void> {
  await client.query(`DELETE FROM carrito_items WHERE expires_at <= NOW()`);
}


export async function GET(req: NextRequest) {
  const ident = await getOwnerKey(req);
  if (!ident) return NextResponse.json([]);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await limpiarExpirados(client);
    await client.query("COMMIT");

    // id_vendedor no se guarda en el carrito, se recompone: el desglose de
    // segunda mano cobra un envío por vendedor y el drawer necesita saberlo
    // para mostrar el mismo total que va a cobrar el checkout.
    const result = await client.query(
      `SELECT ci.producto_id AS id, ci.nombre, ci.cantidad, ci.expires_at,
              ci.precio, ci.imagen, ci.categoria, p.id_vendedor, p.tamano_paquete
       FROM carrito_items ci
       LEFT JOIN productos p ON p.id = ci.producto_id
       WHERE ci.owner_key = $1
       ORDER BY ci.producto_id`,
      [ident.key]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("/api/carrito GET error:", error);
    return NextResponse.json([]);
  } finally {
    client.release();
  }
}


export async function POST(req: NextRequest) {
  const ident = await getOwnerKey(req);
  if (!ident) return NextResponse.json({ ok: false, message: "Sin sesión" }, { status: 200 });

  let items: { id?: number; nombre: string; cantidad: number; precio?: string; imagen?: string; categoria?: string }[];
  try {
    items = await req.json();
    if (!Array.isArray(items)) throw new Error();
  } catch {
    return NextResponse.json({ ok: false, message: "JSON inválido" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await limpiarExpirados(client);

    const oldCartRes = await client.query(
      `SELECT DISTINCT producto_id FROM carrito_items
       WHERE owner_key = $1 AND producto_id IS NOT NULL
         AND (categoria IS NULL OR categoria != 'Segunda Mano')`,
      [ident.key]
    );
    const oldIds = oldCartRes.rows.map((r: { producto_id: number }) => Number(r.producto_id));

    await client.query("DELETE FROM carrito_items WHERE owner_key = $1", [ident.key]);

    const sinStock: string[] = [];

    for (const item of items) {
      if (item.id) {
        if (item.categoria === "Segunda Mano") {
          // La segunda mano ya no pasa por el carrito: cada pieza se compra
          // sola desde su ficha, porque tiene su vendedor, su envío y su propio
          // ciclo de retención. Se descarta en silencio por si queda algún
          // carrito guardado de antes del cambio.
          continue;
        } else {
          const prod = await client.query(
            `SELECT p.stock,
                    COALESCE((
                      SELECT SUM(ci.cantidad)
                      FROM carrito_items ci
                      WHERE ci.producto_id = p.id
                        AND ci.categoria != 'Segunda Mano'
                        AND ci.expires_at > NOW()
                        AND ci.owner_key != $2
                    ), 0) AS reservado_otros
             FROM productos p
             WHERE p.id = $1
             FOR UPDATE`,
            [item.id, ident.key]
          );

          if (prod.rows.length === 0) continue;

          const disponible = Number(prod.rows[0].stock) - Number(prod.rows[0].reservado_otros);

          if (disponible <= 0) {
            sinStock.push(item.nombre);
            continue;
          }

          if (disponible < item.cantidad) {
            sinStock.push(item.nombre);
            item.cantidad = disponible;
          }
        }
      }

      await client.query(
        `INSERT INTO carrito_items
           (owner_key, usuario_id, producto_id, nombre, cantidad, expires_at, precio, imagen, categoria)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 day', $6, $7, $8)`,
        [ident.key, ident.usuarioId, item.id ?? null, item.nombre, item.cantidad,
         item.precio ?? null, item.imagen ?? null, item.categoria ?? null]
      );
    }

    await client.query("COMMIT");

    const newIds: number[] = [];
    for (const i of items) {
      if (i.id && i.categoria !== "Segunda Mano") newIds.push(i.id as number);
    }
    const productoIds = [...new Set([...oldIds, ...newIds])];
    const stocksActualizados: { producto_id: number; stock: number }[] = [];

    for (const pid of productoIds) {
      const res = await client.query(
        `SELECT p.stock,
                COALESCE((SELECT SUM(ci.cantidad) FROM carrito_items ci
                          WHERE ci.producto_id = p.id AND ci.categoria != 'Segunda Mano'
                            AND ci.expires_at > NOW()), 0) AS reservado
         FROM productos p WHERE p.id = $1`,
        [pid]
      );
      if (res.rows.length > 0) {
        const disponible = Math.max(0, Number(res.rows[0].stock) - Number(res.rows[0].reservado));
        stocksActualizados.push({ producto_id: pid, stock: disponible });
        pusher.trigger("stock", "actualizado", { producto_id: pid, stock: disponible }).catch(() => {});
      }
    }

    return NextResponse.json({
      ok: true,
      sinStock: sinStock.length > 0 ? sinStock : undefined,
      stocks: stocksActualizados,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("/api/carrito POST error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  } finally {
    client.release();
  }
}


export async function DELETE(req: NextRequest) {
  const ident = await getOwnerKey(req);
  if (!ident) return NextResponse.json({ ok: true });

  const client = await pool.connect();
  try {
    const oldCartRes = await client.query(
      `SELECT DISTINCT producto_id FROM carrito_items
       WHERE owner_key = $1 AND producto_id IS NOT NULL
         AND (categoria IS NULL OR categoria != 'Segunda Mano')`,
      [ident.key]
    );
    const oldIds = oldCartRes.rows.map((r: { producto_id: number }) => Number(r.producto_id));

    await client.query("DELETE FROM carrito_items WHERE owner_key = $1", [ident.key]);

    for (const pid of oldIds) {
      const res = await client.query(
        `SELECT p.stock,
                COALESCE((SELECT SUM(ci.cantidad) FROM carrito_items ci
                          WHERE ci.producto_id = p.id AND ci.categoria != 'Segunda Mano'
                            AND ci.expires_at > NOW()), 0) AS reservado
         FROM productos p WHERE p.id = $1`,
        [pid]
      );
      if (res.rows.length > 0) {
        const disponible = Math.max(0, Number(res.rows[0].stock) - Number(res.rows[0].reservado));
        pusher.trigger("stock", "actualizado", { producto_id: pid, stock: disponible }).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true });
  } finally {
    client.release();
  }
}
