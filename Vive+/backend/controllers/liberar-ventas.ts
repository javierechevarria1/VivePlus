import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import Stripe from "stripe";
import { liberarVencidas } from "@/backend/services/liberacion-venta";
import { caducarRetornosVencidos } from "@/backend/services/caducidad-devolucion";

// Barrido diario de todo lo que vence por plazo: las ventas cuyo plazo de
// confirmación pasó y las devoluciones cuyo paquete de vuelta nunca salió.
//
// Van juntas y no en dos crons porque son la misma tarea —cerrar lo que el
// tiempo ha decidido— y porque un segundo cron es una entrada más que
// configurar, vigilar y olvidar. Va por GET porque es así como el cron invoca
// las rutas (ver vercel.json y rotar-codigos.ts, que sigue el mismo patrón).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[liberar-ventas] CRON_SECRET no configurado; petición denegada");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  const stripe = key ? new Stripe(key, { apiVersion: "2026-03-25.dahlia" as any }) : undefined;

  const client = await pool.connect();
  try {
    const liberadas = await liberarVencidas(client, stripe);
    if (liberadas.length > 0) {
      console.log(`[liberar-ventas] ${liberadas.length} venta(s) liberadas por plazo vencido: ${liberadas.join(", ")}`);
    }

    // Si una falla no puede impedir la otra: son independientes y las dos
    // tienen que correr todos los días.
    let caducadas: number[] = [];
    try {
      caducadas = await caducarRetornosVencidos(client);
      if (caducadas.length > 0) {
        console.log(`[liberar-ventas] ${caducadas.length} devolución(es) caducadas sin recibir el paquete: ${caducadas.join(", ")}`);
      }
    } catch (err) {
      console.error("[liberar-ventas] Error caducando devoluciones:", err);
    }

    return NextResponse.json({
      ok: true,
      liberadas: liberadas.length,
      ventas: liberadas,
      caducadas: caducadas.length,
      devoluciones: caducadas,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[liberar-ventas]", error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}
