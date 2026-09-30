import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";
import {
  crearEtiqueta,
  direccionTienda,
  partirDireccionComprador,
  sendcloudConfigurado,
} from "@/backend/services/sendcloud";
import { esTamanoValido, TAMANO_POR_DEFECTO, type TamanoPaquete } from "@/backend/services/tarifas-segunda-mano";
import { avisarEnvioAlComprador } from "@/backend/services/email-comprador";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// Pedidos de la tienda para el administrador: lo que hay que preparar y
// enviar. Deja fuera los de segunda mano, que los gestiona cada vendedor
// desde su propio panel.

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.rol !== "admin") {
      return { error: NextResponse.json({ error: "Acceso restringido" }, { status: 403 }) };
    }
    return { ok: true };
  } catch {
    return { error: NextResponse.json({ error: "Token inválido" }, { status: 401 }) };
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT o.id, o.precio_total, o.estado, o.direccion_envio,
              o.sendcloud_id, o.seguimiento, o.seguimiento_url, o.transportista,
              o.estado_envio, o.motivo_sin_etiqueta,
              COALESCE(t.fecha, (SELECT MIN(oi_f.creado_en) FROM orden_item oi_f WHERE oi_f.orden_id = o.id)) AS creado_en,
              COALESCE(u.username, 'Cliente') AS comprador,
              u.email AS comprador_email,
              (SELECT json_agg(json_build_object(
                 'nombre', COALESCE(p2.nombre, 'Producto'),
                 'imagen', p2.imagen,
                 'cantidad', oi2.cantidad,
                 'importe', oi2.precio_items))
               FROM orden_item oi2
               LEFT JOIN productos p2 ON p2.id = oi2.producto_id
               WHERE oi2.orden_id = o.id AND COALESCE(p2.segunda_mano, false) = false) AS items,
              -- Un pedido con devolución en curso tiene que distinguirse en la
              -- lista: si solo se ve desde la pestaña de devoluciones, quien
              -- mira los pedidos no se entera de que ese ya no está cerrado.
              (SELECT d.estado FROM devoluciones d
               WHERE d.orden_id = o.id AND d.estado IN ('solicitada', 'aceptada', 'recibida')
               ORDER BY d.creado_en DESC LIMIT 1) AS devolucion_estado
       FROM orden o
       LEFT JOIN usuarios u ON u.id = o.usr_comprador_id
       LEFT JOIN transacciones t ON t.id = o.transaccion_id
       -- Solo pedidos pagados que contengan algún producto de la tienda.
       WHERE o.estado <> 'pendiente'
         AND EXISTS (
           SELECT 1 FROM orden_item oi
           JOIN productos p ON p.id = oi.producto_id
           WHERE oi.orden_id = o.id AND p.segunda_mano = false
         )
       ORDER BY creado_en DESC NULLS LAST
       LIMIT 200`
    );

    return NextResponse.json({ ok: true, data: rows });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { orden_id, accion, tamano } = await req.json();
  if (!orden_id || !accion) {
    return NextResponse.json({ error: "orden_id y accion son obligatorios" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, estado, direccion_envio, sendcloud_id, transportista, seguimiento
       FROM orden WHERE id = $1`,
      [Number(orden_id)]
    );
    if (rows.length === 0) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    const orden = rows[0];

    // Se genera al empaquetar, no al cobrar: hasta este momento no se sabe si
    // el stock real da, cuánto pesa de verdad ni si el comprador cancelará.
    if (accion === "preparar") {
      if (orden.sendcloud_id) {
        return NextResponse.json({ error: "Este pedido ya tiene etiqueta" }, { status: 409 });
      }
      if (!sendcloudConfigurado()) {
        return NextResponse.json(
          { error: "Los envíos no están configurados. Prepara el paquete y márcalo como enviado a mano.", code: "SIN_TRANSPORTE" },
          { status: 503 }
        );
      }

      const origen = direccionTienda();
      if (!origen) {
        return NextResponse.json(
          { error: "Falta la dirección de la tienda en la configuración del servidor", code: "SIN_DIRECCION_TIENDA" },
          { status: 503 }
        );
      }

      const destino = partirDireccionComprador(orden.direccion_envio);
      if (!destino) {
        return NextResponse.json(
          { error: "No se pudo interpretar la dirección del comprador", code: "DIRECCION_ILEGIBLE" },
          { status: 422 }
        );
      }

      // El tramo lo elige quien empaqueta, que es quien tiene el paquete
      // delante. Sin él se usa el intermedio.
      const tramo: TamanoPaquete = esTamanoValido(tamano) ? tamano : TAMANO_POR_DEFECTO;

      const { rows: items } = await client.query(
        `SELECT COALESCE(p.nombre, 'Pedido') AS nombre FROM orden_item oi
         LEFT JOIN productos p ON p.id = oi.producto_id
         WHERE oi.orden_id = $1 LIMIT 1`,
        [orden.id]
      );

      const resultado = await crearEtiqueta({
        referencia: `pedido-${orden.id}`,
        tamano: tramo,
        destino,
        origen,
        descripcion: items[0]?.nombre ?? `Pedido ${orden.id}`,
      });

      if (!resultado.ok) {
        await client.query(
          `UPDATE orden SET motivo_sin_etiqueta = $1 WHERE id = $2`,
          [resultado.motivo, orden.id]
        );
        return NextResponse.json({ error: `No se pudo crear la etiqueta: ${resultado.motivo}` }, { status: 502 });
      }

      const d = resultado.datos;
      await client.query(
        `UPDATE orden SET sendcloud_id = $1, etiqueta_url = $2, seguimiento = $3,
                          seguimiento_url = $4, transportista = $5, motivo_sin_etiqueta = NULL
         WHERE id = $6`,
        [d.sendcloudId, d.etiquetaUrl, d.seguimiento, d.seguimientoUrl, d.transportista, orden.id]
      );

      return NextResponse.json({ ok: true, seguimiento: d.seguimiento, transportista: d.transportista });
    }

    // Respaldo: el aviso del transportista puede tardar, fallar o no estar
    // configurado, y sin esto el pedido se quedaría en «pendiente» para siempre.
    if (accion === "enviado") {
      if (orden.estado === "enviada" || orden.estado === "entregada") {
        return NextResponse.json({ error: "Este pedido ya figura como enviado" }, { status: 409 });
      }
      await client.query(
        `UPDATE orden SET estado = 'enviada', enviado_en = COALESCE(enviado_en, NOW()) WHERE id = $1`,
        [orden.id]
      );
      await avisarEnvioAlComprador(client, orden.id);
      return NextResponse.json({ ok: true, estado: "enviada" });
    }

    if (accion === "entregado") {
      await client.query(
        `UPDATE orden SET estado = 'entregada', entregado_en = COALESCE(entregado_en, NOW()) WHERE id = $1`,
        [orden.id]
      );
      return NextResponse.json({ ok: true, estado: "entregada" });
    }

    return NextResponse.json({ error: `Acción "${accion}" no reconocida` }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}
