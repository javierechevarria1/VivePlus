import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";
import Stripe from "stripe";
import { liberarVenta } from "@/backend/services/liberacion-venta";
import { avisarEnvioSegundaMano } from "@/backend/services/email-segunda-mano-ciclo";
import { DIAS_AUTO_CONFIRMACION, fechaLimite } from "@/backend/services/tarifas-segunda-mano";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

function getStripe(): Stripe | undefined {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return undefined;
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" as any });
}

async function requireUser(req: NextRequest) {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return { error: "No autorizado" };
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const user_id = (payload.id ?? payload.medicoId) as number | undefined;
    if (!user_id) return { error: "No autorizado" };
    return { user_id, rol: payload.rol as string | undefined };
  } catch {
    return { error: "Token inválido" };
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const rol = new URL(req.url).searchParams.get("rol") === "comprador" ? "comprador" : "vendedor";
  const columna = rol === "comprador" ? "comprador_id" : "vendedor_id";

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT v.id, v.producto_id, v.orden_id, v.estado, v.transportista, v.seguimiento,
              v.etiqueta_url, v.seguimiento_url, v.estado_envio,
              v.importe_producto, v.importe_envio, v.importe_gestion, v.importe_total,
              v.limite_envio, v.limite_confirmacion,
              v.enviado_en, v.entregado_en, v.liberado_en, v.creado_en,
              v.direccion_envio,
              p.nombre, p.imagen,
              comprador.username AS comprador_nombre,
              vendedor.username AS vendedor_nombre
       FROM ventas_segunda_mano v
       JOIN productos p ON p.id = v.producto_id
       LEFT JOIN usuarios comprador ON comprador.id = v.comprador_id
       LEFT JOIN usuarios vendedor ON vendedor.id = v.vendedor_id
       WHERE v.${columna} = $1
       ORDER BY v.creado_en DESC`,
      [auth.user_id]
    );

    // La dirección del comprador solo la ve el vendedor, y solo para enviar.
    const data = rows.map(row =>
      rol === "vendedor" ? row : { ...row, direccion_envio: undefined }
    );

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
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { venta_id, accion, transportista, seguimiento } = await req.json();
  if (!venta_id || !accion) {
    return NextResponse.json({ error: "venta_id y accion son obligatorios" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, vendedor_id, comprador_id, estado, transportista, seguimiento
       FROM ventas_segunda_mano WHERE id = $1`,
      [Number(venta_id)]
    );
    if (rows.length === 0) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });

    const venta = rows[0];
    const esVendedor = Number(venta.vendedor_id) === auth.user_id;
    const esComprador = Number(venta.comprador_id) === auth.user_id;
    const esAdmin = auth.rol === "admin";

    if (accion === "enviado") {
      if (!esVendedor && !esAdmin) {
        return NextResponse.json({ error: "Solo el vendedor puede marcar el envío" }, { status: 403 });
      }
      if (venta.estado !== "pagado") {
        return NextResponse.json({ error: "Esta venta ya no está pendiente de envío" }, { status: 409 });
      }
      // Con etiqueta prepagada el transportista y el seguimiento ya están
      // guardados: el vendedor solo confirma que ha dejado el paquete y no
      // tiene que teclear nada. Sin etiqueta, sigue siendo obligatorio.
      const transportistaFinal = transportista?.trim() || venta.transportista;
      const seguimientoFinal = seguimiento?.trim() || venta.seguimiento;

      if (!transportistaFinal || !seguimientoFinal) {
        return NextResponse.json(
          { error: "Hay que indicar el transportista y el número de seguimiento" },
          { status: 400 }
        );
      }

      // El plazo de auto-confirmación arranca aquí porque todavía no hay
      // tracking automático que avise de la entrega: cuando lo haya, contará
      // desde la entrega real y podrá ser mucho más corto.
      await client.query(
        `UPDATE ventas_segunda_mano
         SET estado = 'enviado', transportista = $1, seguimiento = $2,
             enviado_en = NOW(), limite_confirmacion = $3, actualizado_en = NOW()
         WHERE id = $4`,
        [transportistaFinal, seguimientoFinal, fechaLimite(DIAS_AUTO_CONFIRMACION), venta.id]
      );

      // La orden refleja el mismo envío, para poder consultarlo desde ahí.
      await client.query(
        `UPDATE orden o
         SET estado = 'enviada', enviado_en = COALESCE(o.enviado_en, NOW()),
             transportista = $1, seguimiento = $2
         FROM ventas_segunda_mano v
         WHERE v.id = $3 AND o.id = v.orden_id`,
        [transportistaFinal, seguimientoFinal, venta.id]
      );

      // Después de guardar el seguimiento, para que el correo lo lleve.
      await avisarEnvioSegundaMano(client, venta.id);

      return NextResponse.json({ ok: true, estado: "enviado" });
    }

    if (accion === "recibido") {
      if (!esComprador && !esAdmin) {
        return NextResponse.json({ error: "Solo el comprador puede confirmar la recepción" }, { status: 403 });
      }
      // 'entregado' también vale: el transportista puede haber confirmado la
      // entrega antes de que el comprador entre a decirlo, y confirmar a mano
      // libera el dinero sin esperar al plazo.
      if (venta.estado !== "enviado" && venta.estado !== "entregado") {
        return NextResponse.json({ error: "Esta venta todavía no se ha enviado" }, { status: 409 });
      }

      await client.query(
        `UPDATE ventas_segunda_mano SET estado = 'entregado', entregado_en = NOW(), actualizado_en = NOW()
         WHERE id = $1`,
        [venta.id]
      );

      await client.query(
        `UPDATE orden o
         SET estado = 'entregada', entregado_en = COALESCE(o.entregado_en, NOW())
         FROM ventas_segunda_mano v
         WHERE v.id = $1 AND o.id = v.orden_id`,
        [venta.id]
      );

      // Confirmada la recepción no hay nada más que esperar: el dinero sale ya.
      const resultado = await liberarVenta(client, venta.id, getStripe());
      return NextResponse.json({ ok: true, estado: "liberado", transferido: resultado?.importe ?? null });
    }

    if (accion === "liberar") {
      if (!esAdmin) {
        return NextResponse.json({ error: "Acceso restringido a administradores" }, { status: 403 });
      }
      const resultado = await liberarVenta(client, venta.id, getStripe());
      if (!resultado) {
        return NextResponse.json({ error: "Esta venta ya estaba cerrada" }, { status: 409 });
      }
      return NextResponse.json({ ok: true, estado: "liberado", transferido: resultado.importe });
    }

    return NextResponse.json({ error: `Acción "${accion}" no reconocida` }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}
