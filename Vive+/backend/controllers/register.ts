import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const ROL_IDS: Record<string, number> = {
  usuario: 1,
  intermediario: 2,
  medico: 3,
  dependiente: 4,
};

export async function POST(req: NextRequest) {
  // Máx. 5 registros por IP cada 15 min para frenar creación masiva de cuentas.
  if (rateLimit(`register:${clientIp(req)}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Inténtalo de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  const { username, email, password, edad, sexo, rol, personas_responsables, codigoInvitacion, medicoTag, medicoHorario, medicoTipo, medicoEspecialidad } = await req.json();
  const esMedico = rol === "medico" && typeof codigoInvitacion === "string" && codigoInvitacion.trim() !== "";
  const rolNombre = esMedico ? "medico" : rol === "intermediario" ? "intermediario" : "usuario";
  const rolId = ROL_IDS[rolNombre];

  if (!username || !email || !password || !edad) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return NextResponse.json({ error: "Email no válido" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }

  const edadNum = Number(edad);
  if (!Number.isFinite(edadNum)) {
    return NextResponse.json({ error: "Edad no válida" }, { status: 400 });
  }

  if (rolNombre === "intermediario") {
    if (edadNum < 18) {
      return NextResponse.json({ error: "Debes ser mayor de edad (18+) para registrarte como intermediario." }, { status: 400 });
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (esMedico) {
      const codigoRow = await client.query(
        "SELECT id, estado FROM codigos_invitacion_medico WHERE codigo = $1",
        [codigoInvitacion.trim()]
      );
      if (codigoRow.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Código de invitación no válido" }, { status: 400 });
      }
      if (codigoRow.rows[0].estado) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Este código de invitación ya ha sido utilizado" }, { status: 400 });
      }
    }

    const emailExists = await client.query(
      "SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)",
      [email.trim()]
    );
    if (emailExists.rows.length > 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Ya hay una cuenta registrada con ese email" }, { status: 409 });
    }

    const userExists = await client.query(
      "SELECT id FROM usuarios WHERE username = $1",
      [username.trim()]
    );
    if (userExists.rows.length > 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "El nombre de usuario ya está en uso" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);

    const result = await client.query(
      `INSERT INTO usuarios (email, edad, username, password, rol, sexo, creado_en)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id, email, username, rol`,
      [email.toLowerCase().trim(), edadNum, username.trim(), hash, rolId, sexo?.trim() ?? null]
    );

    const user = result.rows[0];

    if (esMedico) {
      await client.query(
        "UPDATE codigos_invitacion_medico SET estado = TRUE, usado_por = $2 WHERE codigo = $1",
        [codigoInvitacion.trim(), user.id]
      );
      await client.query(
        `INSERT INTO medicos (tag, horario, tipo, especialidad, usuario_medico_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [medicoTag?.trim() ?? "", medicoHorario?.trim() ?? "", medicoTipo?.trim().toLowerCase() ?? "", medicoEspecialidad?.trim() ?? "", user.id]
      );
    }

    if (rolNombre === "intermediario" && Array.isArray(personas_responsables) && personas_responsables.length > 0) {
      await Promise.all(personas_responsables.map(async (persona: { nombre?: string; apellidos?: string; edad?: number | string }) => {
        const nombre    = persona.nombre?.trim();
        const apellidos = (persona.apellidos?.trim() ?? "");
        const edadDep   = persona.edad ? Number(persona.edad) : null;
        if (!nombre) return;

        const depUsername = apellidos ? `${nombre} ${apellidos}` : nombre;

        let depResult: { rows: { id: number }[] };
        try {
          await client.query("SAVEPOINT dep_insert");
          depResult = await client.query(
            `INSERT INTO usuarios (username, edad, rol)
             VALUES ($1, $2, $3) RETURNING id`,
            [depUsername, edadDep, ROL_IDS.dependiente]
          );
          await client.query("RELEASE SAVEPOINT dep_insert");
        } catch (e: unknown) {
          await client.query("ROLLBACK TO SAVEPOINT dep_insert");
          await client.query("RELEASE SAVEPOINT dep_insert");
          if ((e as { code?: string }).code !== "23505") throw e;
          const suffix = Date.now().toString().slice(-5);
          depResult = await client.query(
            `INSERT INTO usuarios (username, edad, rol)
             VALUES ($1, $2, $3) RETURNING id`,
            [`${depUsername}_${suffix}`, edadDep, ROL_IDS.dependiente]
          );
        }

        await client.query(
          `INSERT INTO usuarios_dependientes (usuario_intermediario_id, usuario_dependiente_id)
           VALUES ($1, $2)`,
          [user.id, depResult.rows[0].id]
        );
      }));
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true, user }, { status: 201 });

  } catch (err: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    const message = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/register]", message);
    return NextResponse.json(
      { error: "Error interno al crear la cuenta", detail: process.env.NODE_ENV !== "production" ? message : undefined },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
