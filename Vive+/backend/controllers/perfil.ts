import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";
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
  try {
    const auth = await requireUser(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

    const { userId, action, foto, rol, passActual, passNueva, telefono } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Falta userId" }, { status: 400 });
    }

    if (Number(userId) !== auth.user_id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const client = await pool.connect();
    try {
      
      if (action === "update_foto") {
        if (!foto) return NextResponse.json({ error: "Falta la foto" }, { status: 400 });

        if (rol === "medico") {
          const r1 = await client.query(
            `UPDATE medicos SET photo_url = $1 WHERE id = $2`,
            [foto, userId]
          );

          if (!r1.rowCount) {
            // userId es un usuarios.id (médico vía tabla usuarios): actualizar ambas tablas
            await client.query(
              `UPDATE medicos SET photo_url = $1 WHERE usuario_medico_id = $2`,
              [foto, userId]
            );
            await client.query(`UPDATE usuarios SET foto = $1 WHERE id = $2`, [foto, userId]);
          }
        } else {
          await client.query(
            `UPDATE usuarios SET foto = $1 WHERE id = $2`,
            [foto, userId]
          );
        }
        return NextResponse.json({ ok: true, photoUrl: foto });
      }

      if (action === "update_password") {
        if (!passActual || !passNueva) {
          return NextResponse.json({ error: "Faltan contraseñas" }, { status: 400 });
        }

        
        const res = await client.query(`SELECT password FROM usuarios WHERE id = $1`, [userId]);
        if (res.rows.length === 0) {
          return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        const storedHash = res.rows[0].password;
        
        
        const isBcrypt = storedHash ? storedHash.startsWith("$") : false;
        let isValid = false;

        if (isBcrypt) {
          isValid = await bcrypt.compare(passActual, storedHash);
        } else {
          
          isValid = storedHash === passActual;
        }

        if (!isValid) {
          return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });
        }

        
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(passNueva, salt);

        await client.query(`UPDATE usuarios SET password = $1 WHERE id = $2`, [hash, userId]);

        return NextResponse.json({ ok: true });
      }

      if (action === "update_telefono") {
        await client.query(`UPDATE usuarios SET telefono=$1 WHERE id=$2`, [telefono ?? null, userId]);
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[POST /api/perfil]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
