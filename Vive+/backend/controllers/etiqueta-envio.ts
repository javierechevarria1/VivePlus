import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";
import { cabeceraAuth, sendcloudConfigurado } from "@/backend/services/sendcloud";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// Sirve la etiqueta de envío al vendedor.
//
// No se le puede dar el enlace de Sendcloud directamente por dos motivos:
// hace falta autenticación para descargarlo (con nuestras credenciales, que
// no salen de aquí), y cualquiera con la URL podría bajarse la etiqueta de
// una venta ajena. Este endpoint comprueba antes que quien pide es el
// vendedor de esa venta.

export async function GET(req: NextRequest) {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let userId: number | undefined;
  let rol: string | undefined;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    userId = (payload.id ?? payload.medicoId) as number | undefined;
    rol = payload.rol as string | undefined;
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const params = new URL(req.url).searchParams;
  const ventaId = Number(params.get("venta_id"));
  const pedidoId = Number(params.get("pedido_id"));
  const devolucionId = Number(params.get("devolucion_id"));
  const esDevolucion = Number.isFinite(devolucionId);
  const esPedido = !esDevolucion && Number.isFinite(pedidoId);

  if (!esDevolucion && !esPedido && !Number.isFinite(ventaId)) {
    return NextResponse.json({ error: "Falta el identificador de la venta, el pedido o la devolución" }, { status: 400 });
  }

  if (!sendcloudConfigurado()) {
    return NextResponse.json({ error: "Los envíos no están configurados" }, { status: 503 });
  }

  const client = await pool.connect();
  try {
    // Las etiquetas de los pedidos de la tienda solo las ve el administrador;
    // las de segunda mano, su vendedor; y la de vuelta de una devolución, quien
    // la pidió — es él quien tiene que imprimirla y pegarla en la caja.
    const { rows } = esDevolucion
      ? await client.query(`SELECT usuario_id AS dueno_id, etiqueta_url FROM devoluciones WHERE id = $1`, [devolucionId])
      : esPedido
        ? await client.query(`SELECT NULL::int AS dueno_id, etiqueta_url FROM orden WHERE id = $1`, [pedidoId])
        : await client.query(`SELECT vendedor_id AS dueno_id, etiqueta_url FROM ventas_segunda_mano WHERE id = $1`, [ventaId]);

    if (rows.length === 0) {
      const que = esDevolucion ? "Devolución no encontrada" : esPedido ? "Pedido no encontrado" : "Venta no encontrada";
      return NextResponse.json({ error: que }, { status: 404 });
    }

    const fila = rows[0];
    const autorizado = rol === "admin" || (!esPedido && Number(fila.dueno_id) === userId);
    if (!autorizado) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    if (!fila.etiqueta_url) {
      return NextResponse.json({ error: "Todavía no tiene etiqueta" }, { status: 404 });
    }

    // El enlace que guarda Sendcloud es relativo a su API.
    const url = fila.etiqueta_url.startsWith("http")
      ? fila.etiqueta_url
      : `https://panel.sendcloud.sc${fila.etiqueta_url}`;

    const cual = esDevolucion
      ? `devolucion-${devolucionId}`
      : esPedido ? `pedido-${pedidoId}` : `venta-${ventaId}`;

    const res = await fetch(url, { headers: { Authorization: cabeceraAuth() } });
    if (!res.ok) {
      console.error(`[etiqueta-envio] Sendcloud respondió ${res.status} para ${cual}`);
      return NextResponse.json({ error: "No se pudo obtener la etiqueta" }, { status: 502 });
    }

    return new NextResponse(await res.arrayBuffer(), {
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/pdf",
        "Content-Disposition": `inline; filename="etiqueta-${cual}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[etiqueta-envio]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  } finally {
    client.release();
  }
}
