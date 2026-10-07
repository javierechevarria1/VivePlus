import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: NextRequest) {
  const token = req.cookies.get("r65_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "No hay sesión" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Identidad base tomada del propio token (para rehidratar la sesión en el
    // cliente ahora que la cookie es HttpOnly y no se puede leer desde JS).
    const baseUser = {
      id: (payload.id as number | undefined) ?? (payload.medicoId as number | undefined),
      email: payload.email as string | undefined,
      username: payload.username as string | undefined,
      rol: payload.rol as string | undefined,
      plan_id: (payload.plan_id as number | null | undefined) ?? null,
      plan_activo: payload.plan_activo as boolean | undefined,
    };

    // El admin está protegido por el middleware en cada request; no se le aplica
    // el chequeo de sesión única para que pueda usar múltiples pestañas/dispositivos.
    if (payload.rol === "admin") {
      return NextResponse.json({ ok: true, user: baseUser });
    }

    const id         = payload.id as number | undefined;
    const medicoId   = payload.medicoId as number | undefined;
    const session_id = payload.session_id as string | undefined;

    const client = await pool.connect();
    try {
      let dbSessionId = null;
      let foto: string | null = null;
      let planId: number | null = null;

      if (id) {
        const res = await client.query("SELECT session_id, foto, plan_id FROM usuarios WHERE id = $1", [id]);
        dbSessionId = res.rows[0]?.session_id;
        foto = res.rows[0]?.foto ?? null;
        planId = res.rows[0]?.plan_id ?? null;

        if (payload.rol === "medico" && !foto) {
          try {
            const medicoRes = await client.query("SELECT photo_url FROM medicos WHERE usuario_medico_id = $1", [id]);
            if (medicoRes.rows[0]?.photo_url) foto = medicoRes.rows[0].photo_url;
          } catch {}
        }
      } else if (medicoId) {
        const res = await client.query("SELECT photo_url FROM medicos WHERE id = $1", [medicoId]);
        foto = res.rows[0]?.photo_url ?? null;
      }

      if (dbSessionId && dbSessionId !== session_id) {
        console.warn(`[VerifySession] Mismatch: DB=${dbSessionId}, Token=${session_id}`);
        const response = NextResponse.json({ error: "Sesión iniciada en otro dispositivo" }, { status: 403 });
        response.cookies.delete("r65_token");
        return response;
      }

      if (!session_id && dbSessionId) {
        const response = NextResponse.json({ error: "Sesión expirada o iniciada en otro dispositivo" }, { status: 403 });
        response.cookies.delete("r65_token");
        return response;
      }

      return NextResponse.json({
        ok: true,
        foto,
        plan_id: planId,
        user: { ...baseUser, foto, plan_id: planId },
      });
    } finally {
      client.release();
    }
  } catch (err) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}