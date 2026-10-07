import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { setSessionCookie } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET!;

const ROL_NOMBRES: Record<number | string, string> = {
  1: "usuario",
  2: "intermediario",
  3: "medico",
  4: "dependiente",
  5: "admin",
  6: "usuario_organizacion",
  "usuario": "usuario",
  "intermediario": "intermediario",
  "medico": "medico",
  "dependiente": "dependiente",
  "admin": "admin",
  "usuario_organizacion": "usuario_organizacion",
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Faltan campos." }, { status: 400 });
  }

  // Máx. 10 intentos por IP+email cada 15 min para frenar fuerza bruta.
  const rlKey = `login:${clientIp(req)}:${String(email).toLowerCase().trim()}`;
  if (rateLimit(rlKey, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Inténtalo de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  const client = await pool.connect();
  try {
    if (!password) {
      return NextResponse.json({ error: "Introduce tu contraseña." }, { status: 400 });
    }

    const userResult = await client.query(
      `SELECT id, email, username, password, COALESCE(rol, 1) AS rol, foto, plan_id,
              COALESCE(onboarding_completado, FALSE) AS onboarding_completado
       FROM usuarios WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1) LIMIT 1`,
      [email.trim()]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "Credenciales incorrectas." }, { status: 401 });
    }

    const user = userResult.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      try {
        await client.query(
          `INSERT INTO logins (usuario_id, estado, rol, fecha) VALUES ($1, 'false', $2, NOW())`,
          [user.id, user.rol]
        );
      } catch (e) { console.error("[login] error registrando intento fallido:", e); }
      return NextResponse.json({ error: "Credenciales incorrectas." }, { status: 401 });
    }

    try {
      await client.query(
        `INSERT INTO logins (usuario_id, estado, rol, fecha) VALUES ($1, 'true', $2, NOW())`,
        [user.id, user.rol]
      );
    } catch (e) { console.error("[login] error registrando login correcto:", e); }

    const session_id = crypto.randomUUID();
    await client.query(
      `UPDATE usuarios SET ultimo_acceso = NOW(), session_id = $1, estado_online = TRUE WHERE id = $2`,
      [session_id, user.id]
    );

    const rolNombre = ROL_NOMBRES[user.rol] ?? "usuario";

    let fotoFinal: string | null = user.foto ?? null;
    if (rolNombre === "medico") {
      try {
        const medicoRow = await client.query(
          `SELECT photo_url,
                  COALESCE(docs_estado, 'pendiente') AS docs_estado,
                  COALESCE(plan_activo, FALSE) AS plan_activo
           FROM medicos WHERE usuario_medico_id = $1`,
          [user.id]
        );
        if (medicoRow.rows.length > 0) {
          if (medicoRow.rows[0].photo_url) fotoFinal = medicoRow.rows[0].photo_url;
          const docsEstado: string = medicoRow.rows[0].docs_estado;
          if (docsEstado !== "aprobado") {
            return NextResponse.json({
              error: docsEstado === "en_revision"
                ? "Tu documentación está siendo revisada. Te avisaremos cuando tu perfil sea activado."
                : "Tu cuenta está pendiente de verificación. Sube tu documentación para que podamos revisarla.",
            }, { status: 403 });
          }
          (user as Record<string, unknown>)._plan_activo = medicoRow.rows[0].plan_activo;
        }
      } catch (e) { console.error("[login] error consultando datos de medico:", e); }
    }

    const planActivoFinal = rolNombre === "medico" ? ((user as Record<string, unknown>)._plan_activo ?? false) : undefined;

    const token = jwt.sign(
      {
        id: user.id, email: user.email, username: user.username, rol: rolNombre, session_id, plan_id: user.plan_id ?? null,
        ...(rolNombre === "medico" ? { plan_activo: planActivoFinal } : {}),
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    if (rolNombre === "usuario_organizacion") {
      let planOrgId: number | null = null;
      try {
        const orgRes = await client.query(
          `SELECT plan_org_id FROM organizaciones WHERE usuario_organizacion_id = $1 LIMIT 1`,
          [user.id]
        );
        planOrgId = orgRes.rows[0]?.plan_org_id ?? null;
      } catch {}
      const resOrg = NextResponse.json({
        ok: true,
        token,
        rol: rolNombre,
        user: { id: user.id, email: user.email, username: user.username, rol: rolNombre, foto: fotoFinal, plan_id: user.plan_id ?? null, plan_org_id: planOrgId },
      });
      setSessionCookie(resOrg, token);
      return resOrg;
    }

    const resUser = NextResponse.json({
      ok: true,
      token,
      rol: rolNombre,
      user: {
        id: user.id, email: user.email, username: user.username, rol: rolNombre, foto: fotoFinal, plan_id: user.plan_id ?? null,
        onboarding_completado: user.onboarding_completado ?? false,
        ...(rolNombre === "medico" ? { plan_activo: planActivoFinal } : {}),
      },
    });
    setSessionCookie(resUser, token);
    return resUser;

  } finally {
    client.release();
  }
}
