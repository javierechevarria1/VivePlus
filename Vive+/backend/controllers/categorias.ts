import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

const TABLE_MAP: Record<string, { tabla: string; orderCol: string }> = {
  actividades:    { tabla: "categorias_actividades",    orderCol: "nombre" },
  productos:      { tabla: "categorias_productos",      orderCol: "nombre" },
  organizaciones: { tabla: "categorias_organizaciones", orderCol: "label"  },
  salud:          { tabla: "categorias_salud",          orderCol: "nombre" },
};  

function assertSafeIdentifier(id: string): string {
  if (!/^[a-z_]+$/.test(id)) {
    throw new Error(`Identificador SQL no permitido: ${id}`);
  }
  return id;
}

export async function GET(req: NextRequest) {
  const tipo  = req.nextUrl.searchParams.get("tipo") ?? "";
  const entry = TABLE_MAP[tipo];
  if (!entry) {
    return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  }
  const { tabla, orderCol } = entry;
  try {
    const sql = `SELECT * FROM ${assertSafeIdentifier(tabla)} WHERE activa = true ORDER BY orden, ${assertSafeIdentifier(orderCol)}`;
    const { rows } = await pool.query(sql);
    return NextResponse.json({ categorias: rows });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
