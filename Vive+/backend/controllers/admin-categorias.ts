import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

async function requireAdmin(req: NextRequest): Promise<{ error: NextResponse } | { rol: string }> {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.rol !== "admin") {
      return { error: NextResponse.json({ error: "Acceso restringido a administradores" }, { status: 403 }) };
    }
    return { rol: payload.rol as string };
  } catch {
    return { error: NextResponse.json({ error: "Token inválido" }, { status: 401 }) };
  }
}

const TABLE_MAP: Record<string, string> = {
  actividades:    "categorias_actividades",
  productos:      "categorias_productos",
  organizaciones: "categorias_organizaciones",
  salud:          "categorias_salud",
};

const ORDER_COL: Record<string, string> = {
  actividades:    "nombre",
  productos:      "nombre",
  organizaciones: "label",
  salud:          "nombre",
};

const ALLOWED_FIELDS: Record<string, string[]> = {
  actividades:    ["nombre", "color", "icono", "orden", "activa"],
  productos:      ["nombre", "color", "gradiente", "icono", "orden", "activa"],
  organizaciones: ["key", "label", "bg_color", "text_color", "color", "icono", "orden", "activa"],
  salud:          ["nombre", "color", "orden", "activa"],
};

function getTipo(req: NextRequest): string {
  return req.nextUrl.searchParams.get("tipo") ?? "";
}

function assertSafeIdentifier(id: string): string {
  if (!/^[a-z_]+$/.test(id)) {
    throw new Error(`Identificador SQL no permitido: ${id}`);
  }
  return id;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const tipo  = getTipo(req);
  const tabla = TABLE_MAP[tipo];
  if (!tabla) return NextResponse.json({ error: "tipo inválido" }, { status: 400 });

  try {
    const orderCol = ORDER_COL[tipo] ?? "nombre";
    const sql = `SELECT * FROM ${assertSafeIdentifier(tabla)} ORDER BY orden, ${assertSafeIdentifier(orderCol)}`;
    const { rows } = await pool.query(sql);
    return NextResponse.json({ categorias: rows });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const tipo  = getTipo(req);
  const tabla = TABLE_MAP[tipo];
  if (!tabla) return NextResponse.json({ error: "tipo inválido" }, { status: 400 });

  const body = await req.json();

  try {
    let rows: Record<string, unknown>[];

    if (tipo === "organizaciones") {
      const { key, label, bg_color, text_color, color, icono, orden, activa } = body;
      if (!key?.trim() || !label?.trim()) {
        return NextResponse.json({ error: "key y label son obligatorios" }, { status: 400 });
      }
      const sql = `INSERT INTO ${assertSafeIdentifier(tabla)} (key, label, bg_color, text_color, color, icono, orden, activa)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
      ({ rows } = await pool.query(sql,
        [key.trim(), label.trim(), bg_color || "#EAF5F2", text_color || "#2A7A6A",
         color || "#2A7A6A", icono || "Users", orden ?? 0, activa ?? true]
      ));
    } else if (tipo === "productos") {
      const { nombre, color, gradiente, icono, orden, activa } = body;
      if (!nombre?.trim()) {
        return NextResponse.json({ error: "nombre es obligatorio" }, { status: 400 });
      }
      const sql = `INSERT INTO ${assertSafeIdentifier(tabla)} (nombre, color, gradiente, icono, orden, activa)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
      ({ rows } = await pool.query(sql,
        [nombre.trim(), color || "#2A7A6A", gradiente || "", icono || "Tag", orden ?? 0, activa ?? true]
      ));
    } else if (tipo === "salud") {
      const { nombre, color, orden, activa } = body;
      if (!nombre?.trim()) {
        return NextResponse.json({ error: "nombre es obligatorio" }, { status: 400 });
      }
      const sql = `INSERT INTO ${assertSafeIdentifier(tabla)} (nombre, color, orden, activa) VALUES ($1,$2,$3,$4) RETURNING *`;
      ({ rows } = await pool.query(sql,
        [nombre.trim(), color || "#9B59B6", orden ?? 0, activa ?? true]
      ));
    } else {
      const { nombre, color, icono, orden, activa } = body;
      if (!nombre?.trim()) {
        return NextResponse.json({ error: "nombre es obligatorio" }, { status: 400 });
      }
      const sql = `INSERT INTO ${assertSafeIdentifier(tabla)} (nombre, color, icono, orden, activa) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
      ({ rows } = await pool.query(sql,
        [nombre.trim(), color || "#2A7A6A", icono || "Tag", orden ?? 0, activa ?? true]
      ));
    }

    return NextResponse.json({ categoria: rows[0] }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("_pkey")) {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre/key" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const tipo  = getTipo(req);
  const tabla = TABLE_MAP[tipo];
  if (!tabla) return NextResponse.json({ error: "tipo inválido" }, { status: 400 });

  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const allowed = new Set(ALLOWED_FIELDS[tipo] ?? []);
  const setClauses: string[] = [];
  const values: unknown[]    = [];
  let idx = 1;

  for (const [key, val] of Object.entries(fields)) {
    if (allowed.has(key)) {
      setClauses.push(`"${assertSafeIdentifier(key)}" = $${idx++}`);
      values.push(val);
    }
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: "Sin campos válidos para actualizar" }, { status: 400 });
  }

  values.push(id);

  try {
    const sql = `UPDATE ${assertSafeIdentifier(tabla)} SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`;
    const { rows } = await pool.query(sql, values);
    if (rows.length === 0) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ categoria: rows[0] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre/key" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const tipo  = getTipo(req);
  const tabla = TABLE_MAP[tipo];
  if (!tabla) return NextResponse.json({ error: "tipo inválido" }, { status: 400 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  try {
    const sql = `DELETE FROM ${assertSafeIdentifier(tabla)} WHERE id = $1`;
    const { rowCount } = await pool.query(sql, [id]);
    if (!rowCount) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
