import { NextRequest, NextResponse } from "next/server";
import Pusher from "pusher";
import { getSession } from "@/lib/auth";

const pusher = new Pusher({
  appId:   process.env.PUSHER_APP_ID!,
  key:     process.env.PUSHER_KEY!,
  secret:  process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS:  true,
});

// Reglas de autorización por canal privado. `userId` es el id de sesión
// (usuario o médico) tal y como se compara en el resto de controladores.
function autorizado(channel: string, userId: number): boolean {
  if (channel === "private-presencia") return true; // cualquier usuario autenticado

  let m: RegExpMatchArray | null;
  if ((m = channel.match(/^private-chat-(\d+)-u(\d+)$/)))
    return userId === Number(m[1]) || userId === Number(m[2]);
  if ((m = channel.match(/^private-panel-(\d+)$/)))
    return userId === Number(m[1]);
  if ((m = channel.match(/^private-cercania-(\d+)-(\d+)$/)))
    return userId === Number(m[1]) || userId === Number(m[2]);
  if ((m = channel.match(/^private-notif-(\d+)$/)))
    return userId === Number(m[1]);
  if ((m = channel.match(/^private-solicitudes-(\d+)$/)))
    return userId === Number(m[1]);

  return false;
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const form = await req.formData();
  const socketId = String(form.get("socket_id") ?? "");
  const channel  = String(form.get("channel_name") ?? "");
  if (!socketId || !channel) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  if (!autorizado(channel, session.id)) {
    return NextResponse.json({ error: "Canal no permitido" }, { status: 403 });
  }

  const authResponse = pusher.authorizeChannel(socketId, channel);
  return NextResponse.json(authResponse);
}
