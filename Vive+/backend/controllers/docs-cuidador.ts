import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

async function getMedicoId(payload: Record<string, unknown>): Promise<number | null> {
  if (payload.medicoId) return Number(payload.medicoId);
  if (payload.id && payload.rol === "medico") {
    const r = await pool.query(
      "SELECT id FROM medicos WHERE usuario_medico_id = $1 LIMIT 1",
      [Number(payload.id)]
    );
    return r.rows[0]?.id ?? null;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let payload: Record<string, unknown>;
  try {
    const result = await jwtVerify(token, JWT_SECRET);
    payload = result.payload as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  if (payload.rol !== "medico") {
    return NextResponse.json({ error: "Acceso restringido a cuidadores" }, { status: 403 });
  }

  const medicoId = await getMedicoId(payload);
  if (!medicoId) return NextResponse.json({ error: "Cuidador no encontrado" }, { status: 404 });

  const r = await pool.query(
    `SELECT doc_identidad_url, doc_antecedentes_url, doc_residencia_url, docs_estado, verificado
     FROM medicos WHERE id = $1`,
    [medicoId]
  );

  if (r.rows.length === 0) return NextResponse.json({ error: "Cuidador no encontrado" }, { status: 404 });

  return NextResponse.json(r.rows[0]);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let payload: Record<string, unknown>;
  try {
    const result = await jwtVerify(token, JWT_SECRET);
    payload = result.payload as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  if (payload.rol !== "medico") {
    return NextResponse.json({ error: "Acceso restringido a cuidadores" }, { status: 403 });
  }

  const medicoId = await getMedicoId(payload);
  if (!medicoId) return NextResponse.json({ error: "Cuidador no encontrado" }, { status: 404 });

  const { doc_identidad_url, doc_antecedentes_url, doc_residencia_url } = await req.json();

  if (!doc_identidad_url || !doc_antecedentes_url) {
    return NextResponse.json({ error: "Faltan documentos obligatorios (identidad y antecedentes)" }, { status: 400 });
  }

  await pool.query(
    `UPDATE medicos
     SET doc_identidad_url = $1, doc_antecedentes_url = $2, doc_residencia_url = $3,
         docs_estado = 'en_revision', verificado = FALSE
     WHERE id = $4`,
    [doc_identidad_url, doc_antecedentes_url, doc_residencia_url ?? null, medicoId]
  );

  return NextResponse.json({ ok: true });
}
