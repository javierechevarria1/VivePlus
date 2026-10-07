import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// Dirección desde la que salen los paquetes del vendedor. Es la misma para
// todo lo que publique, por eso vive en el usuario y no en cada producto.
// El transportista la necesitará para recoger (fase 3), y hasta entonces se
// la enviamos al comprador solo cuando hay una venta en curso.

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

export function direccionCompleta(fila: {
  direccion?: string | null; cp?: string | null; ciudad?: string | null; telefono?: string | null;
}): boolean {
  return Boolean(fila.direccion?.trim() && fila.cp?.trim() && fila.ciudad?.trim() && fila.telefono?.trim());
}

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT direccion, cp, ciudad, provincia, telefono FROM usuarios WHERE id = $1`,
      [auth.user_id]
    );
    const datos = rows[0] ?? {};

    // Cuántos productos suyos se publicaron antes de que existiera el tramo de
    // envío: es lo que dispara el aviso de "completa tus productos".
    const { rows: pendientes } = await client.query(
      `SELECT id, nombre FROM productos
       WHERE id_vendedor = $1 AND segunda_mano = true
         AND estado = 'disponible' AND tamano_paquete IS NULL
       ORDER BY id`,
      [auth.user_id]
    );

    return NextResponse.json({
      ok: true,
      data: datos,
      completa: direccionCompleta(datos),
      productos_sin_tamano: pendientes,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { direccion, cp, ciudad, provincia, telefono } = await req.json();

  if (!direccion?.trim() || !cp?.trim() || !ciudad?.trim() || !telefono?.trim()) {
    return NextResponse.json(
      { error: "La dirección, el código postal, la ciudad y el teléfono son obligatorios" },
      { status: 400 }
    );
  }
  if (!/^\d{5}$/.test(cp.trim())) {
    return NextResponse.json({ error: "El código postal debe tener 5 dígitos" }, { status: 400 });
  }
  if (telefono.replace(/\D/g, "").length !== 9) {
    return NextResponse.json({ error: "El teléfono debe tener 9 dígitos" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE usuarios SET direccion = $1, cp = $2, ciudad = $3, provincia = $4, telefono = $5
       WHERE id = $6`,
      [direccion.trim(), cp.trim(), ciudad.trim(), provincia?.trim() || null, telefono.trim(), auth.user_id]
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}
