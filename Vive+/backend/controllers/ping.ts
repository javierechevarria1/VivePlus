import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import Pusher from "pusher";

const pusher = new Pusher({
  appId:   process.env.PUSHER_APP_ID!,
  key:     process.env.PUSHER_KEY!,
  secret:  process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS:  true,
});

export async function POST(req: NextRequest) {
  let body: { user_id: number; offline?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { user_id, offline } = body;
  if (!user_id) return NextResponse.json({ error: "Falta user_id" }, { status: 400 });

  const client = await pool.connect();
  try {
    if (offline) {
      
      await client.query(
        `UPDATE usuarios SET estado_online = FALSE, ultimo_acceso = NOW() - INTERVAL '10 minutes' WHERE id = $1`,
        [user_id]
      );
      await pusher.trigger("private-presencia", "cambio-estado", { user_id, status: "offline" });
    } else {
      await client.query(
        `UPDATE usuarios SET ultimo_acceso = NOW(), estado_online = TRUE WHERE id = $1`,
        [user_id]
      );
      await pusher.trigger("private-presencia", "cambio-estado", { user_id, status: "online" });
    }
    return NextResponse.json({ ok: true });
  } finally {
    client.release();
  }
}