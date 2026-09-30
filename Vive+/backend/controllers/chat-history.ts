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
  const cuidador_id = searchParams.get("cuidador_id");
  const usuario_id  = searchParams.get("usuario_id");

  if (!cuidador_id) {
    return NextResponse.json({ error: "Falta cuidador_id" }, { status: 400 });
  }

  const participante = usuario_id
    ? auth.user_id === Number(cuidador_id) || auth.user_id === Number(usuario_id)
    : auth.user_id === Number(cuidador_id);
  if (!participante) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const client = await pool.connect();
  try {
    if (usuario_id) {

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
        [Number(cuidador_id), Number(usuario_id)]
      );


      const result = await client.query(
        `SELECT cm.id,
                CASE WHEN cm.usuario_id = $2 THEN 'user' ELSE 'care' END AS "from",
                cm.texto      AS text,
                cm.audio_id,
                cm.creado_en
         FROM chat_mensajes cm
         JOIN chat c ON c.id = cm.chat_id
         WHERE (c.usuario_escritor_id = $1 AND c.usuario_receptor_id = $2)
            OR (c.usuario_escritor_id = $2 AND c.usuario_receptor_id = $1)
         ORDER BY cm.creado_en ASC
         LIMIT 200`,
        [Number(cuidador_id), Number(usuario_id)]
      );
      return NextResponse.json({ messages: result.rows });

    } else {
      
      const result = await client.query(
        `SELECT
           CASE WHEN c.usuario_escritor_id = $1 THEN c.usuario_receptor_id
                ELSE c.usuario_escritor_id END                    AS usuario_id,
           COALESCE(u.username, 'Usuario')                        AS username,
           COALESCE(cm.texto, '🎤 Mensaje de voz')               AS ultimo_mensaje,
           cm.creado_en                                           AS ultimo_at,
           CASE
             WHEN u.ultimo_acceso > NOW() - INTERVAL '2 minutes'  THEN 'online'
             WHEN u.ultimo_acceso > NOW() - INTERVAL '10 minutes' THEN 'away'
             ELSE 'offline'
           END AS status,
           (SELECT COUNT(*) FROM chat_mensajes m2
            WHERE m2.chat_id = c.id
              AND m2.leido = false
              AND m2.usuario_id != $1) AS no_leidos
         FROM chat c
         JOIN chat_mensajes cm ON cm.chat_id = c.id
         LEFT JOIN usuarios u ON u.id = CASE WHEN c.usuario_escritor_id = $1
                                             THEN c.usuario_receptor_id
                                             ELSE c.usuario_escritor_id END
         WHERE (c.usuario_escritor_id = $1 OR c.usuario_receptor_id = $1)
           AND cm.creado_en = (
             SELECT MAX(m2.creado_en) FROM chat_mensajes m2 WHERE m2.chat_id = c.id
           )
         ORDER BY cm.creado_en DESC`,
        [Number(cuidador_id)]
      );
      return NextResponse.json({ conversaciones: result.rows });
    }
  } catch (err) {
    console.error("[chat/history] Error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  } finally {
    client.release();
  }
}
