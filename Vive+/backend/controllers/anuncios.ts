import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

async function requireAdmin(req: NextRequest): Promise<{ error: NextResponse } | { rol: string }> {
  const token = req.cookies.get("r65_token")?.value;
  if (!token) return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
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
  try {
    const { searchParams } = new URL(req.url);
    const ubicacion = searchParams.get("ubicacion");
    const id = searchParams.get("id");

    if (id) {
      
      await pool.query(
        "UPDATE anuncios SET clics = clics + 1 WHERE id = $1",
        [parseInt(id)]
      );
      return NextResponse.json({ ok: true });
    }

    let query = "SELECT * FROM anuncios WHERE activo = true";
    let params: any[] = [];

    if (ubicacion) {
      query += " AND ubicacion = $1";
      params.push(ubicacion);
    }

    const all = searchParams.get("all") === "true";
    
    if (all) {
      query += " ORDER BY RANDOM()";
      const result = await pool.query(query, params);
      
      
      if (result.rows.length > 0) {
        const ids = result.rows.map(r => r.id);
        await pool.query(`UPDATE anuncios SET impresiones = impresiones + 1 WHERE id = ANY($1::int[])`, [ids]);
      }
      return NextResponse.json(result.rows);
    }

    query += " ORDER BY RANDOM() LIMIT 1";

    const result = await pool.query(query, params);

    
    if (result.rows.length > 0) {
      await pool.query(
        "UPDATE anuncios SET impresiones = impresiones + 1 WHERE id = $1",
        [result.rows[0].id]
      );
    }

    return NextResponse.json(result.rows.length > 0 ? result.rows[0] : null);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}



export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { empresa, imagen, url_destino, ubicacion, fecha_inicio, fecha_fin, activo } = body;

    const result = await pool.query(
      `INSERT INTO anuncios (empresa, imagen, url_destino, ubicacion, fecha_inicio, fecha_fin, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [empresa, imagen, url_destino, ubicacion, fecha_inicio || null, fecha_fin || null, activo ?? true]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[anuncios POST] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { id, empresa, imagen, url_destino, ubicacion, fecha_inicio, fecha_fin, activo } = body;

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const result = await pool.query(
      `UPDATE anuncios 
       SET empresa = $1, imagen = $2, url_destino = $3, ubicacion = $4, 
           fecha_inicio = $5, fecha_fin = $6, activo = $7
       WHERE id = $8 RETURNING *`,
      [empresa, imagen, url_destino, ubicacion, fecha_inicio || null, fecha_fin || null, activo ?? true, id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await pool.query("DELETE FROM anuncios WHERE id = $1", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}