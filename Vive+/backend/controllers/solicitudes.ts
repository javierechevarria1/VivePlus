import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { pusher } from "@/backend/services/pusher";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "Falta user_id" }, { status: 400 });

  try {
    const [{ rows: recibidas }, { rows: amigos }, { rows: enviadas }] = await Promise.all([
      pool.query(
        `SELECT s.id, s.usuario_emisor_id AS from_user, s.creado_en, u.username, u.edad
         FROM solicitudes_cercania s
         JOIN usuarios u ON u.id = s.usuario_emisor_id
         WHERE s.usuario_receptor_id = $1 AND s.estado = 'pendiente'
         ORDER BY s.creado_en DESC`,
        [userId]
      ),
      pool.query(
        `SELECT DISTINCT
           CASE WHEN usuario_emisor_id = $1 THEN usuario_receptor_id ELSE usuario_emisor_id END AS amigo_id
         FROM solicitudes_cercania
         WHERE (usuario_emisor_id = $1 OR usuario_receptor_id = $1) AND estado = 'aceptada'`,
        [userId]
      ),
      pool.query(
        `SELECT usuario_receptor_id AS to_user FROM solicitudes_cercania
         WHERE usuario_emisor_id = $1 AND estado = 'pendiente'`,
        [userId]
      ),
    ]);

    return NextResponse.json({
      recibidas,
      amigos: amigos.map((r: { amigo_id: number }) => r.amigo_id),
      enviadas: enviadas.map((r: { to_user: number }) => r.to_user),
    });
  } catch (err) {
    console.error("[GET /api/solicitudes]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { from_user, to_user } = await req.json();
  if (!from_user || !to_user) return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });

  try {
    await pool.query(
      `INSERT INTO solicitudes_cercania (usuario_emisor_id, usuario_receptor_id, estado)
       VALUES ($1, $2, 'pendiente')
       ON CONFLICT DO NOTHING`,
      [from_user, to_user]
    );

    const [{ rows: [solicitud] }, { rows: [sender] }] = await Promise.all([
      pool.query(
        `SELECT id FROM solicitudes_cercania WHERE usuario_emisor_id = $1 AND usuario_receptor_id = $2`,
        [from_user, to_user]
      ),
      pool.query(`SELECT username FROM usuarios WHERE id = $1`, [from_user]),
    ]);

    await pusher.trigger(`private-solicitudes-${to_user}`, "nueva-solicitud", {
      id:       solicitud?.id,
      from_user,
      username: sender?.username ?? "Alguien",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/solicitudes]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { solicitud_id, accion, from_user, to_user } = await req.json();

  if (!solicitud_id || !accion) return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });

  const estado = accion === "aceptar" ? "aceptada" : "rechazada";

  try {
    await pool.query(
      `UPDATE solicitudes_cercania SET estado = $1 WHERE id = $2`,
      [estado, solicitud_id]
    );

    if (accion === "aceptar" && from_user && to_user) {

      await pool.query(
        `INSERT INTO amigos_cercania (solicitudes_id, usuario1_id, usuario2_id)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [solicitud_id, from_user, to_user]
      ).catch(() => {});

      await pusher.trigger(`private-solicitudes-${from_user}`, "solicitud-aceptada", {
        to_user,
      });
    }

    return NextResponse.json({ ok: true, estado });
  } catch (err) {
    console.error("[PATCH /api/solicitudes]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user_id, amigo_id } = await req.json();

  if (!user_id || !amigo_id) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM amigos_cercania
       WHERE (usuario1_id = $1 AND usuario2_id = $2)
          OR (usuario1_id = $2 AND usuario2_id = $1)`,
      [user_id, amigo_id]
    );
    await client.query(
      `DELETE FROM solicitudes_cercania
       WHERE (usuario_emisor_id = $1 AND usuario_receptor_id = $2)
          OR (usuario_emisor_id = $2 AND usuario_receptor_id = $1)`,
      [user_id, amigo_id]
    );
    await client.query("COMMIT");

    await pusher.trigger(`private-solicitudes-${amigo_id}`, "amistad-eliminada", {
      eliminado_por: user_id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[DELETE /api/solicitudes]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  } finally {
    client.release();
  }
}
