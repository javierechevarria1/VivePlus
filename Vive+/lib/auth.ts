import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export const SESSION_COOKIE = "r65_token";
const SESSION_MAX_AGE = 7 * 24 * 3600; // 7 días

/**
 * Fija la cookie de sesión como HttpOnly (no legible desde JS → sin robo por XSS).
 * `secure` solo en producción para no romper el dev local en http.
 */
export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export type SessionUser = {
  id: number;
  email?: string;
  username?: string;
  rol?: string;
  session_id?: string;
  plan_id?: number | null;
  medicoId?: number;
  plan_activo?: boolean;
};

/**
 * Variante basada en NextRequest para usar dentro de los controladores
 * (que reciben `req`). Centraliza el `jwtVerify(cookie r65_token)` que estaba
 * duplicado en ~37 controladores. Devuelve null si no hay sesión válida.
 */
export async function getSession(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const id = (payload.id as number | undefined) ?? (payload.medicoId as number | undefined);
    if (id === undefined) return null;
    return {
      id,
      email: payload.email as string | undefined,
      username: payload.username as string | undefined,
      rol: payload.rol as string | undefined,
      session_id: payload.session_id as string | undefined,
      plan_id: (payload.plan_id as number | null | undefined) ?? null,
      medicoId: payload.medicoId as number | undefined,
      plan_activo: payload.plan_activo as boolean | undefined,
    };
  } catch {
    return null;
  }
}

/** True si la petición trae una sesión válida con rol admin. */
export async function requireAdmin(req: NextRequest): Promise<boolean> {
  const s = await getSession(req);
  return s?.rol === "admin";
}

/** Lee y verifica la cookie r65_token en un Server Component / Route Handler. Devuelve null si no hay sesión válida. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get("r65_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const id = (payload.id as number | undefined) ?? (payload.medicoId as number | undefined);
    if (id === undefined) return null;
    return {
      id,
      email: payload.email as string | undefined,
      username: payload.username as string | undefined,
      rol: payload.rol as string | undefined,
      session_id: payload.session_id as string | undefined,
      plan_id: (payload.plan_id as number | null | undefined) ?? null,
      plan_activo: payload.plan_activo as boolean | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Puerta de las páginas de administración. Se llama desde el Server Component
 * de la ruta, de modo que quien no sea admin recibe el redirect antes de que
 * se envíe una sola línea del panel; comprobarlo en el cliente dejaba ver el
 * contenido durante un instante y confiaba en un sessionStorage editable.
 */
export async function requireAdminPage(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.rol !== "admin") redirect("/");
  return user;
}
