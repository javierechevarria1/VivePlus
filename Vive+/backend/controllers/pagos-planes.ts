import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

type TokenPayload = {
  id?: number;
  medicoId?: number;
  rol?: string;
};

async function parseToken(req: NextRequest): Promise<{ error: NextResponse } | TokenPayload> {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as TokenPayload;
  } catch {
    return { error: NextResponse.json({ error: "Token inválido" }, { status: 401 }) };
  }
}

export async function GET(req: NextRequest) {
  const parsed = await parseToken(req);
  if ("error" in parsed) return parsed.error;

  const { searchParams } = new URL(req.url);
  const isAdmin = parsed.rol === "admin";

  let entidad_tipo: string | null;
  let entidad_id: number | null;
  const plan_id = searchParams.get("plan_id");

  if (isAdmin) {
    entidad_tipo = searchParams.get("entidad_tipo");
    entidad_id = searchParams.get("entidad_id") ? Number(searchParams.get("entidad_id")) : null;
  } else if (parsed.rol === "medico") {
    entidad_tipo = "medico";
    entidad_id = parsed.medicoId ?? null;
  } else {
    entidad_tipo = "usuario";
    entidad_id = parsed.id ?? null;
  }

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (entidad_tipo) {
    values.push(entidad_tipo);
    conditions.push(`pp.entidad_tipo = $${values.length}`);
  }
  if (entidad_id != null) {
    values.push(entidad_id);
    conditions.push(`pp.entidad_id = $${values.length}`);
  }
  if (plan_id != null) {
    values.push(plan_id);
    conditions.push(`pp.plan_id = $${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const client = await pool.connect();
  try {
    const sql = `SELECT
         pp.id,
         pp.plan_id,
         pl.nombre AS plan_nombre,
         pl.intervalo AS plan_intervalo,
         pp.entidad_id,
         pp.entidad_tipo,
         pp.precio,
         pp.pagado_en
       FROM pagos_planes pp
       JOIN planes pl ON pl.id = pp.plan_id
       ${where}
       ORDER BY pp.pagado_en DESC`;
    const { rows } = await client.query(sql, values);
    return NextResponse.json(rows);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(req: NextRequest) {
  const parsed = await parseToken(req);
  if ("error" in parsed) return parsed.error;
  if (parsed.rol !== "admin") {
    return NextResponse.json({ error: "Acceso restringido a administradores" }, { status: 403 });
  }

  const body = await req.json();
  const { plan_id, entidad_id, entidad_tipo, precio } = body;

  if (!plan_id || !entidad_id || !entidad_tipo || precio == null) {
    return NextResponse.json(
      { error: "plan_id, entidad_id, entidad_tipo y precio son obligatorios" },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `INSERT INTO pagos_planes (plan_id, entidad_id, entidad_tipo, precio)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [plan_id, Number(entidad_id), entidad_tipo, Number(precio)]
    );
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  } finally {
    client.release();
  }
}
