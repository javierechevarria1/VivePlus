import { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";
import { DIAS_DESISTIMIENTO, avisoSiYaLiberada, reembolsar } from "@/backend/services/reembolso";
import {
  crearEtiqueta,
  direccionTienda,
  partirDireccionComprador,
  sendcloudConfigurado,
  type EtiquetaCreada,
} from "@/backend/services/sendcloud";
import { DIAS_LIMITE_RETORNO, envioTienda, fechaLimite, porteDevolucion } from "@/backend/services/tarifas-segunda-mano";
import {
  avisarDevolucionAceptada,
  avisarDevolucionRechazada,
  avisarDevolucionSolicitada,
  avisarReembolsoHecho,
} from "@/backend/services/email-devolucion";
import { avisarIncidenciaAlVendedor } from "@/backend/services/email-segunda-mano-ciclo";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// La devolución sigue abierta mientras el artículo no haya vuelto y el dinero
// no se haya devuelto. Es la lista que usan el filtro del panel y los índices
// que impiden pedir dos veces lo mismo.
const ESTADOS_ABIERTOS = ["solicitada", "aceptada", "recibida"];

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

// Cuenta el plazo desde la entrega. Si el transportista no la ha confirmado
// todavía, se cuenta desde la compra: al comprador no puede perjudicarle que
// no tengamos el dato.
function diasRestantes(entregadoEn: Date | null, creadoEn: Date | null): number {
  const referencia = entregadoEn ?? creadoEn;
  if (!referencia) return DIAS_DESISTIMIENTO;
  const transcurridos = (Date.now() - new Date(referencia).getTime()) / (1000 * 60 * 60 * 24);
  return Math.ceil(DIAS_DESISTIMIENTO - transcurridos);
}

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const esAdmin = auth.rol === "admin";
  const soloAbiertas = new URL(req.url).searchParams.get("abiertas") === "true";

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT d.*,
              u.username AS solicitante, u.email AS solicitante_email,
              p.nombre AS producto
       FROM devoluciones d
       LEFT JOIN usuarios u ON u.id = d.usuario_id
       LEFT JOIN ventas_segunda_mano v ON v.id = d.venta_id
       LEFT JOIN productos p ON p.id = v.producto_id
       WHERE ($1::boolean OR d.usuario_id = $2)
         AND ($3::boolean = false OR d.estado = ANY($4::text[]))
       ORDER BY d.creado_en DESC
       LIMIT 200`,
      [esAdmin, auth.user_id, soloAbiertas, ESTADOS_ABIERTOS]
    );

    // Cuánto se le descontaría a cada una por el viaje de vuelta, y qué queda
    // por tanto para reembolsar. Se calcula aquí y no en la pantalla para que
    // la tarifa siga viviendo en un único sitio, y no en SQL para poder usar
    // las mismas funciones que el resto del sistema.
    const ordenIds = rows.map(r => r.orden_id).filter((id): id is number => id != null);
    const vueltaPorOrden = new Map<number, number>();

    if (ordenIds.length > 0) {
      const { rows: lineas } = await client.query<{
        orden_id: number; tamano_paquete: string | null; precio: string; cantidad: number;
      }>(
        `SELECT oi.orden_id, p.tamano_paquete, p.precio, oi.cantidad
         FROM orden_item oi JOIN productos p ON p.id = oi.producto_id
         WHERE oi.orden_id = ANY($1::int[]) AND p.segunda_mano = false`,
        [ordenIds]
      );

      for (const ordenId of new Set(ordenIds)) {
        const suyas = lineas.filter(l => l.orden_id === ordenId);
        if (suyas.length === 0) continue;
        const { tramo } = envioTienda(
          suyas.map(l => ({ tamano: l.tamano_paquete, precio: Number(l.precio), cantidad: Number(l.cantidad) }))
        );
        vueltaPorOrden.set(ordenId, porteDevolucion(tramo));
      }
    }

    const data = rows.map(d => {
      // No se descuenta el retorno ni en segunda mano —ahí no hay
      // desistimiento— ni cuando el fallo es nuestro.
      const vuelta = d.orden_id != null && d.tipo !== "incidencia"
        ? vueltaPorOrden.get(d.orden_id) ?? 0
        : 0;
      const total = Number(d.importe_solicitado ?? 0);
      return {
        ...d,
        descuento_vuelta: vuelta,
        importe_sugerido: Math.max(Math.round((total - vuelta) * 100) / 100, 0),
      };
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

// El comprador pide la devolución.
export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { orden_id, venta_id, motivo, tipo } = await req.json();
  if (!orden_id && !venta_id) {
    return NextResponse.json({ error: "Indica el pedido o la venta" }, { status: 400 });
  }
  if (orden_id && venta_id) {
    return NextResponse.json({ error: "Indica solo uno de los dos" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    // Solo puede devolver quien compró, y solo algo ya entregado o en camino.
    const { rows } = orden_id
      ? await client.query(
          // Cualificado con o.: transacciones también tiene una columna estado.
          `SELECT o.usr_comprador_id AS comprador, o.estado, o.precio_total AS importe,
                  o.entregado_en, t.fecha AS creado_en
           FROM orden o LEFT JOIN transacciones t ON t.id = o.transaccion_id
           WHERE o.id = $1`, [Number(orden_id)])
      : await client.query(
          `SELECT comprador_id AS comprador, estado, importe_total AS importe,
                  entregado_en, creado_en
           FROM ventas_segunda_mano WHERE id = $1`, [Number(venta_id)]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "No se encontró la compra" }, { status: 404 });
    }
    const compra = rows[0];

    if (Number(compra.comprador) !== auth.user_id && auth.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const restantes = diasRestantes(compra.entregado_en, compra.creado_en);
    // Una incidencia (no llegó, llegó roto) no está sujeta al plazo de
    // desistimiento: se puede reclamar aunque hayan pasado los 14 días.
    const esDesistimiento = tipo !== "incidencia";
    if (esDesistimiento && restantes <= 0) {
      return NextResponse.json(
        { error: `El plazo de devolución de ${DIAS_DESISTIMIENTO} días ya ha vencido`, code: "PLAZO_VENCIDO" },
        { status: 409 }
      );
    }

    const { rows: creada } = await client.query(
      `INSERT INTO devoluciones (orden_id, venta_id, usuario_id, tipo, motivo, importe_solicitado)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, estado`,
      [
        orden_id ? Number(orden_id) : null,
        venta_id ? Number(venta_id) : null,
        auth.user_id,
        esDesistimiento ? "desistimiento" : "incidencia",
        motivo?.trim() || null,
        compra.importe,
      ]
    );

    // Sin esto la solicitud espera en el panel a que alguien mire por su cuenta,
    // que es exactamente lo que pasaba antes con los pedidos.
    await avisarDevolucionSolicitada(client, creada[0].id);

    // Y en segunda mano hay un tercero al que esto le afecta: el vendedor, que
    // hasta ahora se enteraba porque su dinero no llegaba.
    if (venta_id) {
      await avisarIncidenciaAlVendedor(client, Number(venta_id), motivo?.trim() || null);
    }

    return NextResponse.json({ ok: true, id: creada[0].id, dias_restantes: restantes });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // El índice parcial impide dos solicitudes abiertas sobre lo mismo.
    if (msg.includes("idx_devolucion_")) {
      return NextResponse.json({ error: "Ya hay una devolución en curso para esta compra" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

// Compra la etiqueta del viaje de vuelta: el mismo trayecto que la ida, con
// el origen y el destino intercambiados. El porte lo paga la plataforma, así
// que el comprador no tiene que adelantar nada ni acertar con el transporte.
//
// El tramo no se le pregunta a nadie: es el mismo con el que salió el pedido,
// que es el del artículo más grande que iba dentro.
async function etiquetaDeVuelta(
  client: PoolClient,
  ordenId: number
): Promise<{ ok: true; datos: EtiquetaCreada } | { ok: false; motivo: string }> {
  if (!sendcloudConfigurado()) {
    return { ok: false, motivo: "Los envíos no están configurados" };
  }

  const destino = direccionTienda();
  if (!destino) {
    return { ok: false, motivo: "Falta la dirección de la tienda en la configuración del servidor" };
  }

  const { rows } = await client.query<{ direccion_envio: string | null }>(
    `SELECT direccion_envio FROM orden WHERE id = $1`,
    [ordenId]
  );
  const origen = partirDireccionComprador(rows[0]?.direccion_envio);
  if (!origen) {
    return { ok: false, motivo: "No se pudo interpretar la dirección del comprador" };
  }

  const { rows: lineas } = await client.query<{ tamano_paquete: string | null; precio: string; cantidad: number }>(
    `SELECT p.tamano_paquete, p.precio, oi.cantidad
     FROM orden_item oi JOIN productos p ON p.id = oi.producto_id
     WHERE oi.orden_id = $1 AND p.segunda_mano = false`,
    [ordenId]
  );
  if (lineas.length === 0) {
    return { ok: false, motivo: "El pedido no tiene artículos de la tienda" };
  }

  const { tramo } = envioTienda(
    lineas.map(l => ({ tamano: l.tamano_paquete, precio: Number(l.precio), cantidad: Number(l.cantidad) }))
  );

  return crearEtiqueta({
    referencia: `devolucion-${ordenId}`,
    tamano: tramo,
    origen,
    destino,
    descripcion: `Devolución del pedido ${ordenId}`,
  });
}

// El administrador resuelve: acepta y pide el producto de vuelta, devuelve el
// dinero, o rechaza.
export async function PATCH(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (auth.rol !== "admin") {
    return NextResponse.json({ error: "Acceso restringido a administradores" }, { status: 403 });
  }

  const { id, accion, respuesta, importe, confirmado } = await req.json();
  if (!id || !accion) {
    return NextResponse.json({ error: "id y accion son obligatorios" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, orden_id, venta_id, estado, tipo, importe_solicitado, sendcloud_id
       FROM devoluciones WHERE id = $1`,
      [Number(id)]
    );
    if (rows.length === 0) return NextResponse.json({ error: "Devolución no encontrada" }, { status: 404 });
    const dev = rows[0];

    if (accion === "rechazar") {
      if (dev.estado !== "solicitada") {
        return NextResponse.json({ error: "Esta devolución ya está resuelta" }, { status: 409 });
      }
      await client.query(
        `UPDATE devoluciones SET estado = 'rechazada', respuesta = $1, resuelto_en = NOW() WHERE id = $2`,
        [respuesta?.trim() || null, dev.id]
      );
      await avisarDevolucionRechazada(client, dev.id);
      return NextResponse.json({ ok: true, estado: "rechazada" });
    }

    // Acepta la devolución y pide el producto de vuelta. El dinero todavía no
    // se mueve: se devuelve cuando el paquete llega, que es lo que evita
    // reembolsar algo que nunca se envía.
    if (accion === "aceptar") {
      if (dev.estado !== "solicitada") {
        return NextResponse.json({ error: "Esta devolución ya está aceptada o resuelta" }, { status: 409 });
      }
      // Entre particulares el artículo tendría que volver a casa del vendedor,
      // y eso todavía no existe: una incidencia se resuelve reembolsando.
      if (!dev.orden_id) {
        return NextResponse.json(
          { error: "Las incidencias de segunda mano se resuelven reembolsando, no pidiendo el producto de vuelta", code: "SIN_RETORNO" },
          { status: 400 }
        );
      }

      const etiqueta = await etiquetaDeVuelta(client, dev.orden_id);

      // Si la etiqueta falla, la devolución se acepta igual y queda anotado
      // por qué: dejarla en «solicitada» obligaría al comprador a esperar a
      // que se arregle algo que no es cosa suya.
      if (!etiqueta.ok) {
        await client.query(
          `UPDATE devoluciones
           SET estado = 'aceptada', respuesta = COALESCE($1, respuesta),
               motivo_sin_etiqueta = $2, aceptado_en = NOW(), limite_retorno = $3,
               resuelto_en = COALESCE(resuelto_en, NOW())
           WHERE id = $4`,
          [respuesta?.trim() || null, etiqueta.motivo, fechaLimite(DIAS_LIMITE_RETORNO), dev.id]
        );
        await avisarDevolucionAceptada(client, dev.id);
        return NextResponse.json({
          ok: true,
          estado: "aceptada",
          etiqueta: false,
          aviso: `Aceptada, pero sin etiqueta de vuelta: ${etiqueta.motivo}. Hay que darle instrucciones al comprador a mano.`,
        });
      }

      const d = etiqueta.datos;
      await client.query(
        `UPDATE devoluciones
         SET estado = 'aceptada', respuesta = COALESCE($1, respuesta),
             sendcloud_id = $2, etiqueta_url = $3, seguimiento = $4,
             seguimiento_url = $5, transportista = $6, motivo_sin_etiqueta = NULL,
             aceptado_en = NOW(), limite_retorno = $7,
             resuelto_en = COALESCE(resuelto_en, NOW())
         WHERE id = $8`,
        [
          respuesta?.trim() || null,
          d.sendcloudId, d.etiquetaUrl, d.seguimiento, d.seguimientoUrl, d.transportista,
          fechaLimite(DIAS_LIMITE_RETORNO),
          dev.id,
        ]
      );

      // Se avisa después de guardar la etiqueta, no antes: el correo la lleva.
      await avisarDevolucionAceptada(client, dev.id);

      return NextResponse.json({ ok: true, estado: "aceptada", etiqueta: true, seguimiento: d.seguimiento });
    }

    if (accion === "reembolsar") {
      if (dev.estado === "reembolsada") {
        return NextResponse.json({ error: "Esta devolución ya se reembolsó" }, { status: 409 });
      }

      // Si al vendedor ya se le pagó, devolver el dinero al comprador lo pone
      // la plataforma. No se bloquea —a veces hay que hacerlo igual— pero no
      // puede pasar sin que quien lo autoriza lo sepa.
      if (dev.venta_id && !confirmado) {
        const aviso = await avisoSiYaLiberada(client, dev.venta_id);
        if (aviso) {
          return NextResponse.json(
            { error: aviso, code: "REQUIERE_CONFIRMACION" },
            { status: 409 }
          );
        }
      }

      const resultado = await reembolsar(client, {
        ordenId: dev.orden_id,
        ventaId: dev.venta_id,
        importe: importe != null ? Number(importe) : null,
        // Una incidencia es que el servicio falló, no que se haya arrepentido:
        // ahí el viaje de vuelta no se le cobra. Lo decide el tipo que eligió
        // el comprador al abrirla, no la memoria de quien resuelve.
        descontarRetorno: dev.tipo !== "incidencia",
        motivo: respuesta ?? undefined,
      });

      if (!resultado.ok) {
        return NextResponse.json({ error: resultado.motivo }, { status: 502 });
      }

      await client.query(
        `UPDATE devoluciones
         SET estado = 'reembolsada', respuesta = COALESCE($1, respuesta),
             importe_reembolsado = $2, stripe_refund_id = $3,
             resuelto_en = COALESCE(resuelto_en, NOW()), reembolsado_en = NOW()
         WHERE id = $4`,
        [respuesta?.trim() || null, resultado.importe, resultado.refundId, dev.id]
      );

      // El origen queda marcado para que no siga apareciendo como una compra
      // normal ni se le libere dinero a nadie.
      if (dev.venta_id) {
        await client.query(
          `UPDATE ventas_segunda_mano SET estado = 'reembolsado', reembolsado_en = NOW() WHERE id = $1`,
          [dev.venta_id]
        );
      } else if (dev.orden_id) {
        await client.query(`UPDATE orden SET estado = 'cancelada' WHERE id = $1`, [dev.orden_id]);

        // La unidad vuelve al catálogo, pero solo si el paquete llegó de
        // verdad: en un reembolso directo —el artículo se perdió por el
        // camino, o se devuelve sin pedirlo de vuelta— no hay nada que
        // reponer, y sumarlo inventaría existencias que no están en la
        // estantería.
        if (dev.estado === "recibida") {
          await client.query(
            `UPDATE productos p
             SET stock = p.stock + oi.cantidad
             FROM orden_item oi
             WHERE oi.orden_id = $1 AND oi.producto_id = p.id AND p.segunda_mano = false`,
            [dev.orden_id]
          );
        }
      }

      await avisarReembolsoHecho(client, dev.id);

      return NextResponse.json({ ok: true, estado: "reembolsada", importe: resultado.importe });
    }

    return NextResponse.json({ error: `Acción "${accion}" no reconocida` }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}
