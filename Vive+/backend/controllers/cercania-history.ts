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

  const { searchParams } = new URL(req.url);
  const user_from = searchParams.get("user_from");
  const user_to   = searchParams.get("user_to");

  if (!user_from) {
    return NextResponse.json({ error: "Falta user_from" }, { status: 400 });
  }

  if (auth.user_id !== Number(user_from)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const client = await pool.connect();
  try {
    if (user_to) {
      await client.query(
        `UPDATE chat_mensajes cm
         SET leido = true
         FROM chat c
         WHERE cm.chat_id = c.id
           AND (
             (c.usuario_escritor_id = $1 AND c.usuario_receptor_id = $2)
             OR (c.usuario_escritor_id = $2 AND c.usuario_receptor_id = $1)
           )
           AND cm.usuario_id = $2
           AND cm.leido = false`,
        [Number(user_from), Number(user_to)]
      );

      const result = await client.query(
        `SELECT cm.id, cm.usuario_id AS user_from, cm.texto, cm.audio_id, cm.creado_en
         FROM chat_mensajes cm
         JOIN chat c ON c.id = cm.chat_id
         WHERE (c.usuario_escritor_id = $1 AND c.usuario_receptor_id = $2)
            OR (c.usuario_escritor_id = $2 AND c.usuario_receptor_id = $1)
         ORDER BY cm.creado_en ASC
         LIMIT 100`,
        [Number(user_from), Number(user_to)]
      );
      return NextResponse.json({ messages: result.rows });

    } else {
      const result = await client.query(
        `SELECT
           CASE WHEN c.usuario_escritor_id = $1 THEN c.usuario_receptor_id
                ELSE c.usuario_escritor_id END AS otro_usuario_id,
           COUNT(*) FILTER (WHERE cm.leido = false AND cm.usuario_id != $1) AS no_leidos,
           (
             SELECT m2.texto FROM chat_mensajes m2
             WHERE m2.chat_id = c.id
               AND m2.leido = false
               AND m2.usuario_id != $1
             ORDER BY m2.creado_en DESC
             LIMIT 1
           ) AS ultimo_no_leido
         FROM chat c
         JOIN chat_mensajes cm ON cm.chat_id = c.id
         WHERE (c.usuario_escritor_id = $1 OR c.usuario_receptor_id = $1)
         GROUP BY c.id,
           CASE WHEN c.usuario_escritor_id = $1 THEN c.usuario_receptor_id
                ELSE c.usuario_escritor_id END`,
        [Number(user_from)]
      );
      return NextResponse.json({ unreads: result.rows });
    }
  } finally {
    client.release();
  }
}
