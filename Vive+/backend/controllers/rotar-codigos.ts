import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import crypto from "crypto";

function generarCodigo(): string {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[rotar-codigos] CRON_SECRET no configurado; petición denegada");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const CANTIDAD = 10;
  const nuevos = Array.from({ length: CANTIDAD }, generarCodigo);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM codigos_invitacion_medico WHERE estado = FALSE");
    const values = nuevos.map((_, i) => `($${i + 1}, FALSE)`).join(", ");
    await client.query(
      `INSERT INTO codigos_invitacion_medico (codigo, estado) VALUES ${values}`,
      nuevos
    );
    await client.query("COMMIT");
    return NextResponse.json({ ok: true, generados: CANTIDAD });
  } catch (err: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[rotar-codigos]", err);
    return NextResponse.json({ error: "Error al rotar códigos" }, { status: 500 });
  } finally {
    client.release();
  }
}
