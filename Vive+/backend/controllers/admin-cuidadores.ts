import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return (payload as Record<string, unknown>).rol === "admin";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const r = await pool.query(`
    SELECT
      m.id,
      COALESCE(u.username, '') AS nombre,
      m.especialidad,
      m.tipo,
      m.doc_identidad_url,
      m.doc_antecedentes_url,
      m.doc_residencia_url,
      m.docs_estado,
      m.verificado
    FROM medicos m
    LEFT JOIN usuarios u ON u.id = m.usuario_medico_id
    ORDER BY
      CASE m.docs_estado
        WHEN 'en_revision' THEN 1
        WHEN 'rechazado'   THEN 2
        WHEN 'pendiente'   THEN 3
        WHEN 'aprobado'    THEN 4
        ELSE 5
      END,
      m.id
  `);

  return NextResponse.json({ cuidadores: r.rows });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { medicoId, accion } = await req.json();

  if (!medicoId || !["aprobar", "rechazar"].includes(accion)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const verificado  = accion === "aprobar";
  const docs_estado = accion === "aprobar" ? "aprobado" : "rechazado";

  await pool.query(
    `UPDATE medicos SET verificado = $1, docs_estado = $2 WHERE id = $3`,
    [verificado, docs_estado, medicoId]
  );

  return NextResponse.json({ ok: true });
}
