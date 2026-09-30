import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");

  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT o.id,
        u.username AS nombre,
        o.organizaciones_categoria_id,
        COALESCE(co.key, '') AS tipo,
        o.descripcion, o.web, u.email AS email, o.telefono, o.direccion, o.ciudad, o.estado,
        u.foto AS logo_url
      FROM organizaciones o
      LEFT JOIN categorias_organizaciones co ON co.id = o.organizaciones_categoria_id
      LEFT JOIN usuarios u ON u.id = o.usuario_organizacion_id
      WHERE o.plan_org_id IS NOT NULL
      ORDER BY u.username
    `);

    return NextResponse.json({ organizaciones: result.rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[GET /api/organizaciones]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}