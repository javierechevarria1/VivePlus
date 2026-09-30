import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import Pusher from "pusher";
import { jwtVerify } from "jose";
import { contieneLenguajeInapropiado } from "@/lib/moderacion";

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

const pusher = new Pusher({
  appId:   process.env.PUSHER_APP_ID!,
  key:     process.env.PUSHER_KEY!,
  secret:  process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS:  true,
});

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { user_from, user_to, texto, audio_id } = await req.json();

  if (!user_from || !user_to || (!texto?.trim() && !audio_id)) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  if (auth.user_id !== Number(user_from)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  
  if (texto && contieneLenguajeInapropiado(texto)) {
    return NextResponse.json({ error: "Tu mensaje contiene lenguaje inapropiado y no puede ser enviado" }, { status: 400 });
  }

  const client = await pool.connect();
  try {

    const chatRes = await client.query(
      `SELECT id FROM chat
       WHERE (usuario_escritor_id = $1 AND usuario_receptor_id = $2)
          OR (usuario_escritor_id = $2 AND usuario_receptor_id = $1)
       LIMIT 1`,
      [user_from, user_to]
    );

    let chatId: number;
    if (chatRes.rows.length > 0) {
      chatId = chatRes.rows[0].id;
    } else {
      const newChat = await client.query(
        `INSERT INTO chat (usuario_escritor_id, usuario_receptor_id)
         VALUES ($1, $2) RETURNING id`,
        [user_from, user_to]
      );
      chatId = newChat.rows[0].id;
    }

    const msgRes = await client.query(
      `INSERT INTO chat_mensajes (usuario_id, texto, audio_id, chat_id, creado_en)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, usuario_id AS user_from, texto, audio_id, creado_en`,
      [user_from, texto?.trim() ?? null, audio_id ?? null, chatId]
    );

    const msg = msgRes.rows[0];
    const channelId = `private-cercania-${Math.min(user_from, user_to)}-${Math.max(user_from, user_to)}`;

    await pusher.trigger(channelId, "nuevo-mensaje", {
      id:         msg.id,
      user_from:  msg.user_from,
      user_to,
      texto:      msg.texto,
      audio_id:   msg.audio_id ?? null,
      creado_en:  msg.creado_en,
    });

    await pusher.trigger(`private-notif-${user_to}`, "nuevo-mensaje", {
      user_from: msg.user_from,
      texto:     msg.audio_id ? "🎤 Mensaje de voz" : msg.texto,
    });

    return NextResponse.json({ ok: true, msg });
  } finally {
    client.release();
  }
}
