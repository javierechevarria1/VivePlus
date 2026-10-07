import { NextRequest, NextResponse } from "next/server";
import { PoolClient } from "pg";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

async function requireAdmin(req: NextRequest): Promise<{ error: NextResponse } | { rol: string }> {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.rol !== "admin") {
      return { error: NextResponse.json({ error: "Acceso restringido a administradores" }, { status: 403 }) };
    }
    return { rol: payload.rol as string };
  } catch {
    return { error: NextResponse.json({ error: "Token inválido" }, { status: 401 }) };
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const { rows } = await pool.query(`
      SELECT
        o.id, o.usuario_organizacion_id,
        u.username AS nombre,
        o.organizaciones_categoria_id,
        COALESCE(co.key, '') AS tipo,
        o.descripcion, o.web,
        u.email AS email,
        o.telefono, o.direccion, o.ciudad, o.estado,
        u.foto AS logo_url,
        COALESCE(
          json_agg(json_build_object('nombre', s.nombre, 'descripcion', COALESCE(s.descripcion, '')))
          FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) AS servicios
      FROM organizaciones o
      LEFT JOIN categorias_organizaciones co ON co.id = o.organizaciones_categoria_id
      LEFT JOIN usuarios u ON u.id = o.usuario_organizacion_id
      LEFT JOIN organizacion_servicios os ON os.organizacion_id = o.id
      LEFT JOIN servicios s ON s.id = os.servicios_id
      GROUP BY o.id, o.usuario_organizacion_id,
               u.username, u.email, u.foto,
               o.organizaciones_categoria_id, co.key,
               o.descripcion, o.web,
               o.telefono, o.direccion, o.ciudad, o.estado
      ORDER BY u.username
    `);
    return NextResponse.json({ organizaciones: rows });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[GET /api/admin-organizaciones]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { organizaciones_categoria_id, descripcion, web, telefono, direccion, ciudad, estado, servicios } = body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO organizaciones (organizaciones_categoria_id, descripcion, web, telefono, direccion, ciudad, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        organizaciones_categoria_id ?? null,
        descripcion ?? "",
        web?.trim() || null,
        telefono?.trim() || null,
        direccion?.trim() || null,
        ciudad?.trim() || null,
        estado?.trim() || null,
      ]
    );
    const orgId = rows[0].id;

    if (Array.isArray(servicios) && servicios.length > 0) {
      await upsertServicios(client, orgId, servicios);
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true, id: orgId }, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { id, organizaciones_categoria_id, descripcion, web, telefono, direccion, ciudad, estado, servicios } = body;

  if (!id) {
    return NextResponse.json({ error: "id es obligatorio" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE organizaciones
       SET organizaciones_categoria_id = $1, descripcion = $2, web = $3,
           telefono = $4, direccion = $5, ciudad = $6, estado = $7
       WHERE id = $8`,
      [
        organizaciones_categoria_id ?? null,
        descripcion ?? "",
        web?.trim() || null,
        telefono?.trim() || null,
        direccion?.trim() || null,
        ciudad?.trim() || null,
        estado?.trim() || null,
        Number(id),
      ]
    );

    await client.query(`DELETE FROM organizacion_servicios WHERE organizacion_id = $1`, [Number(id)]);
    if (Array.isArray(servicios) && servicios.length > 0) {
      await upsertServicios(client, Number(id), servicios);
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id es obligatorio" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orgRow = await client.query(
      `SELECT usuario_organizacion_id FROM organizaciones WHERE id = $1`,
      [Number(id)]
    );
    const usuarioOrgId: number | null = orgRow.rows[0]?.usuario_organizacion_id ?? null;

    await client.query(`DELETE FROM anuncios WHERE organizacion_id = $1`, [Number(id)]);
    await client.query(`DELETE FROM organizacion_servicios WHERE organizacion_id = $1`, [Number(id)]);
    await client.query(`DELETE FROM organizaciones WHERE id = $1`, [Number(id)]);

    if (usuarioOrgId) {
      await client.query(`DELETE FROM logins WHERE usuario_id = $1`, [usuarioOrgId]);
      await client.query(`DELETE FROM usuarios WHERE id = $1`, [usuarioOrgId]);
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}


export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { nombre, password, photo_url, descripcion, organizaciones_categoria_id, web, email, telefono, direccion, ciudad, estado } = body;

  if (!nombre?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "nombre y password son obligatorios" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const emailToInsert = email?.trim() || null;
    const existing = await client.query(
      "SELECT id FROM usuarios WHERE LOWER(username) = LOWER($1) OR ($2::text IS NOT NULL AND LOWER(email) = LOWER($2))",
      [nombre.trim(), emailToInsert]
    );
    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Ya existe una cuenta con ese nombre o email" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);

    const userResult = await client.query(
      `INSERT INTO usuarios (username, email, password, rol, foto, creado_en)
       VALUES ($1, $2, $3, 6, $4, NOW()) RETURNING id`,
      [nombre.trim(), emailToInsert, hash, photo_url?.trim() || null]
    );
    const userId = userResult.rows[0].id;

    let tipoKey: string | null = null;
    if (organizaciones_categoria_id) {
      const catRes = await client.query(
        `SELECT key FROM categorias_organizaciones WHERE id = $1`,
        [organizaciones_categoria_id]
      );
      tipoKey = catRes.rows[0]?.key ?? null;
    }

    const { rows } = await client.query(
      `INSERT INTO organizaciones (usuario_organizacion_id, organizaciones_categoria_id, tipo, descripcion, web, telefono, direccion, ciudad, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        userId,
        organizaciones_categoria_id ?? null,
        tipoKey ?? "",
        descripcion ?? "",
        web?.trim() || null,
        telefono?.trim() || null,
        direccion?.trim() || null,
        ciudad?.trim() || null,
        estado?.trim() || "activa",
      ]
    );

    await client.query("COMMIT");
    return NextResponse.json({ ok: true, id: rows[0].id, usuario_id: userId }, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[PATCH /api/admin-organizaciones]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}


async function upsertServicios(
  client: PoolClient,
  orgId: number,
  servicios: { nombre: string; descripcion: string }[]
) {
  await Promise.all(servicios.map(async srv => {
    const nombre = srv.nombre?.trim();
    if (!nombre) return;

    const res = await client.query(
      `SELECT id FROM servicios WHERE LOWER(nombre) = LOWER($1) LIMIT 1`,
      [nombre]
    );
    let servicioId: number;
    if (res.rows.length > 0) {
      servicioId = res.rows[0].id;
      if (srv.descripcion?.trim()) {
        await client.query(
          `UPDATE servicios SET descripcion = $1 WHERE id = $2`,
          [srv.descripcion.trim(), servicioId]
        );
      }
    } else {
      const ins = await client.query(
        `INSERT INTO servicios (nombre, descripcion) VALUES ($1, $2) RETURNING id`,
        [nombre, srv.descripcion?.trim() ?? ""]
      );
      servicioId = ins.rows[0].id;
    }

    await client.query(
      `INSERT INTO organizacion_servicios (organizacion_id, servicios_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [orgId, servicioId]
    );
  }));
}
