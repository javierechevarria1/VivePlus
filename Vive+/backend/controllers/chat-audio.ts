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

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("audio") as File | null;
  if (!file) return NextResponse.json({ error: "Sin archivo de audio" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "audio/webm";
  const duracionRaw = formData.get("duracion");
  const duracion = duracionRaw ? Number(duracionRaw) : null;

  const result = await pool.query(
    `INSERT INTO chat_audios (datos, mime_type, duracion_seg) VALUES ($1, $2, $3) RETURNING id`,
    [buffer, mimeType, duracion]
  );
  return NextResponse.json({ id: result.rows[0].id });
}

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const ownerCheck = await pool.query(
    `SELECT 1 FROM chat_mensajes cm
     JOIN chat c ON c.id = cm.chat_id
     WHERE cm.audio_id = $1
       AND (c.usuario_escritor_id = $2 OR c.usuario_receptor_id = $2)
     LIMIT 1`,
    [id, auth.user_id]
  );
  if (!ownerCheck.rows.length) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT datos, mime_type FROM chat_audios WHERE id = $1`,
    [id]
  );
  if (!result.rows.length) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { datos, mime_type } = result.rows[0] as { datos: Buffer; mime_type: string };
  const bytes = Buffer.isBuffer(datos) ? new Uint8Array(datos) : datos;
  const total = bytes.length;

  const rangeHeader = req.headers.get("range");
  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : total - 1;
      const clampedEnd = Math.min(end, total - 1);
      const chunk = bytes.slice(start, clampedEnd + 1);
      return new Response(chunk, {
        status: 206,
        headers: {
          "Content-Type": mime_type,
          "Content-Range": `bytes ${start}-${clampedEnd}/${total}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunk.length),
          "Cache-Control": "private, max-age=86400",
        },
      });
    }
  }

  return new Response(bytes, {
    headers: {
      "Content-Type": mime_type,
      "Accept-Ranges": "bytes",
      "Content-Length": String(total),
      "Cache-Control": "private, max-age=86400",
    },
  });
}

