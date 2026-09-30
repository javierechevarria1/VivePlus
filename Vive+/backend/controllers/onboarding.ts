import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function requireUser(req: NextRequest) {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return { error: "No autorizado" };
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const user_id = (payload.id ?? payload.medicoId) as number | undefined;
    if (!user_id) return { error: "No autorizado" };
    return { user_id };
  } catch {
    return { error: "Token inválido" };
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });
  const userId = auth.user_id;

  const client = await pool.connect();
  try {
    const userRes = await client.query(
      `SELECT onboarding_completado FROM usuarios WHERE id = $1`, [userId]
    );
    if (!userRes.rows.length) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const completado: boolean = userRes.rows[0].onboarding_completado ?? false;

    const depRes = await client.query(
      `SELECT ud.usuario_dependiente_id,
              u.username AS nombre, u.edad,
              ud.ciudad, ud.situacion_convivencial,
              dp.autonomia, dp.discapacidades
       FROM usuarios_dependientes ud
       JOIN usuarios u ON u.id = ud.usuario_dependiente_id
       LEFT JOIN dependencia_perfil dp ON dp.usuario_dependiente_id = ud.usuario_dependiente_id
       WHERE ud.usuario_intermediario_id = $1
       ORDER BY u.id ASC`,
      [userId]
    );

    return NextResponse.json({ completado, dependientes: depRes.rows });
  } finally {
    client.release();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });
  const userId = auth.user_id;

  const body = await req.json();
  const { step, data } = body as { step: number | string; data: Record<string, unknown> };

  if (!step || !data) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

  const client = await pool.connect();
  try {
    // ── Onboarding wizard (primer acceso) ──────────────────────────────────
    if (step === 1) {
      await client.query(
        `UPDATE usuarios_dependientes
         SET ciudad=$1, situacion_convivencial=$2
         WHERE usuario_intermediario_id=$3`,
        [data.ciudad, data.situacion_convivencial, userId]
      );
      return NextResponse.json({ ok: true });
    }

    if (step === 2) {
      const depRes = await client.query(
        `SELECT usuario_dependiente_id FROM usuarios_dependientes
         WHERE usuario_intermediario_id = $1 LIMIT 1`, [userId]
      );
      if (!depRes.rows.length) return NextResponse.json({ error: "Sin dependiente vinculado" }, { status: 400 });
      const depId = depRes.rows[0].usuario_dependiente_id;

      const discapacidades = Array.isArray(data.discapacidades) ? data.discapacidades : [];
      await client.query(
        `INSERT INTO dependencia_perfil (usuario_dependiente_id, autonomia, discapacidades)
         VALUES ($1,$2,$3)
         ON CONFLICT (usuario_dependiente_id) DO UPDATE
           SET autonomia=$2, discapacidades=$3, updated_at=NOW()`,
        [depId, data.autonomia, discapacidades]
      );

      await client.query(`UPDATE usuarios SET onboarding_completado=TRUE WHERE id=$1`, [userId]);
      return NextResponse.json({ ok: true, completado: true });
    }

    // ── Guardar dependiente existente ──────────────────────────────────────
    if (step === "save_dependiente") {
      const depId = Number(data.dependiente_id);
      if (!depId) return NextResponse.json({ error: "Falta dependiente_id" }, { status: 400 });

      const vinculo = await client.query(
        `UPDATE usuarios_dependientes
         SET ciudad=$1, situacion_convivencial=$2
         WHERE usuario_dependiente_id=$3 AND usuario_intermediario_id=$4`,
        [data.ciudad, data.situacion_convivencial, depId, userId]
      );
      if (!vinculo.rowCount) {
        return NextResponse.json({ error: "Dependiente no encontrado" }, { status: 404 });
      }
      await client.query(
        `UPDATE usuarios SET username=$1, edad=$2 WHERE id=$3`,
        [data.nombre, data.edad ?? null, depId]
      );
      const discapacidades = Array.isArray(data.discapacidades) ? data.discapacidades : [];
      await client.query(
        `INSERT INTO dependencia_perfil (usuario_dependiente_id, autonomia, discapacidades)
         VALUES ($1,$2,$3)
         ON CONFLICT (usuario_dependiente_id) DO UPDATE
           SET autonomia=$2, discapacidades=$3, updated_at=NOW()`,
        [depId, data.autonomia ?? null, discapacidades]
      );
      return NextResponse.json({ ok: true });
    }

    // ── Añadir nuevo dependiente ───────────────────────────────────────────
    if (step === "add_dependiente") {
      const nombre = String(data.nombre ?? "").trim();
      if (!nombre) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });

      const ROL_DEPENDIENTE = 4;
      const newUser = await client.query(
        `INSERT INTO usuarios (username, edad, rol) VALUES ($1,$2,$3) RETURNING id`,
        [nombre, data.edad ?? null, ROL_DEPENDIENTE]
      );
      const newDepId = newUser.rows[0].id;

      await client.query(
        `INSERT INTO usuarios_dependientes (usuario_intermediario_id, usuario_dependiente_id, ciudad, situacion_convivencial)
         VALUES ($1,$2,$3,$4)`,
        [userId, newDepId, data.ciudad ?? null, data.situacion_convivencial ?? null]
      );
      const discapacidades = Array.isArray(data.discapacidades) ? data.discapacidades : [];
      if (data.autonomia) {
        await client.query(
          `INSERT INTO dependencia_perfil (usuario_dependiente_id, autonomia, discapacidades)
           VALUES ($1,$2,$3)`,
          [newDepId, data.autonomia, discapacidades]
        );
      }
      return NextResponse.json({ ok: true, dependiente_id: newDepId });
    }

    // ── Dismiss ────────────────────────────────────────────────────────────
    if (step === "dismiss") {
      await client.query(`UPDATE usuarios SET onboarding_completado=TRUE WHERE id=$1`, [userId]);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Step inválido" }, { status: 400 });
  } finally {
    client.release();
  }
}
