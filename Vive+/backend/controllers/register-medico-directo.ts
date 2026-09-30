import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const {
      username, email, password, edad, sexo,
      codigoInvitacion, medicoTag, medicoHorario, medicoTipo, medicoEspecialidad,
      docIdentidadUrl, docAntecedentesUrl, docResidenciaUrl,
    } = await req.json();

    if (!username || !email || !password || !edad || !codigoInvitacion) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return NextResponse.json({ error: "Email no válido" }, { status: 400 });
    }
    if ((password as string).length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const codigoRow = await client.query(
        "SELECT id, estado FROM codigos_invitacion_medico WHERE codigo = $1",
        [codigoInvitacion.trim()]
      );
      if (codigoRow.rows.length === 0) {
        return NextResponse.json({ error: "Código de invitación no válido" }, { status: 400 });
      }
      if (codigoRow.rows[0].estado) {
        return NextResponse.json({ error: "Este código ya ha sido utilizado" }, { status: 400 });
      }

      const emailExists = await client.query(
        "SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)",
        [email.trim()]
      );
      if (emailExists.rows.length > 0) {
        return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 });
      }

      const userExists = await client.query(
        "SELECT id FROM usuarios WHERE username = $1",
        [username.trim()]
      );
      if (userExists.rows.length > 0) {
        return NextResponse.json({ error: "El nombre de usuario ya está en uso" }, { status: 409 });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      await client.query("BEGIN");

      const userResult = await client.query(
        `INSERT INTO usuarios (email, edad, username, password, rol, sexo, creado_en)
         VALUES ($1, $2, $3, $4, 3, $5, NOW()) RETURNING id`,
        [email.toLowerCase().trim(), Number(edad), username.trim(), passwordHash, sexo?.trim() || null]
      );
      const userId = userResult.rows[0].id;

      await client.query(
        "UPDATE codigos_invitacion_medico SET estado = TRUE, usado_por = $2 WHERE codigo = $1",
        [codigoInvitacion.trim(), userId]
      );

      const hasDocs = !!(docIdentidadUrl || docAntecedentesUrl);
      await client.query(
        `INSERT INTO medicos (tag, horario, tipo, especialidad, usuario_medico_id, plan_activo,
          doc_identidad_url, doc_antecedentes_url, doc_residencia_url, docs_estado, verificado)
         VALUES ($1, $2, $3, $4, $5, FALSE, $6, $7, $8, $9, FALSE)`,
        [
          medicoTag?.trim() || null,
          medicoHorario?.trim() || null,
          medicoTipo?.trim().toLowerCase() || null,
          medicoEspecialidad?.trim() || null,
          userId,
          docIdentidadUrl || null,
          docAntecedentesUrl || null,
          docResidenciaUrl || null,
          hasDocs ? "en_revision" : "pendiente",
        ]
      );

      await client.query("COMMIT");
      return NextResponse.json({ ok: true });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Registro Médico Directo]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
