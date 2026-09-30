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
  const latitud  = searchParams.get("latitud");
  const longitud = searchParams.get("longitud");
  const radio_km = Math.min(parseFloat(searchParams.get("radio") ?? "5"), 50);

  if (!latitud || !longitud) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
          id,
          username,
          edad,
          foto,
          latitud,
          longitud,
          ultimo_acceso,
          CASE
            WHEN ultimo_acceso > NOW() - INTERVAL '90 seconds' THEN 'online'
            WHEN ultimo_acceso > NOW() - INTERVAL '10 minutes' THEN 'away'
            ELSE 'offline'
          END AS status,
          (
            6371 * acos(
              GREATEST(-1, LEAST(1,
                cos(radians($1)) * cos(radians(latitud)) *
                cos(radians(longitud) - radians($2)) +
                sin(radians($1)) * sin(radians(latitud))
              ))
            )
          ) AS distancia_km
       FROM usuarios
       WHERE id != $3
         AND latitud IS NOT NULL
         AND longitud IS NOT NULL
         AND id NOT IN (SELECT usuario_medico_id FROM medicos WHERE usuario_medico_id IS NOT NULL)
         AND id NOT IN (SELECT usuario_dependiente_id FROM usuarios_dependientes)
         AND rol IN (1, 2)
         AND (
            6371 * acos(
              GREATEST(-1, LEAST(1,
                cos(radians($1)) * cos(radians(latitud)) *
                cos(radians(longitud) - radians($2)) +
                sin(radians($1)) * sin(radians(latitud))
              ))
            )
          ) <= $4
       ORDER BY distancia_km ASC
       LIMIT 50`,
      [parseFloat(latitud), parseFloat(longitud), auth.user_id, radio_km]
    );

    const users = result.rows.map(u => ({
      id:              u.id,
      username:        u.username,
      edad:            u.edad,
      foto:            u.foto ?? null,
      latitud:         u.latitud,
      longitud:        u.longitud,
      status:          u.status,
      distancia_km:    parseFloat(u.distancia_km.toFixed(2)),
      distancia_texto: u.distancia_km < 1
        ? `${Math.round(u.distancia_km * 1000)} m`
        : `${u.distancia_km.toFixed(1)} km`,
    }));

    return NextResponse.json({ users });
  } finally {
    client.release();
  }
}