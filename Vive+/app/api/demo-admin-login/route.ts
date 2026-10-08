import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { setSessionCookie } from "@/lib/auth";

const DEMO_ADMIN_EMAIL = "admin@relatia55.com";
const DEMO_ADMIN_PASSWORD = "Admin1234!";

export async function POST(req: NextRequest) {
  if (process.env.LOCAL_DEMO !== "true") {
    return NextResponse.json({ error: "Ruta no disponible." }, { status: 404 });
  }

  const body = await req.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (email !== DEMO_ADMIN_EMAIL || password !== DEMO_ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Credenciales incorrectas." }, { status: 401 });
  }

  const user = {
    id: 9000,
    email: DEMO_ADMIN_EMAIL,
    username: "Admin",
    rol: "admin",
    plan_id: null,
  };
  const token = jwt.sign(
    { ...user, session_id: crypto.randomUUID() },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" },
  );
  const response = NextResponse.json({ ok: true, user });
  setSessionCookie(response, token);
  return response;
}
