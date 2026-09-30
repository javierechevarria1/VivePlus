import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const query = `
      SELECT
        m.id,
        u.id AS cuidador_usuario_id,
        m.especialidad,
        m.tag,
        m.horario,
        m.categorias_salud_id,
        COALESCE(cs.nombre, m.tipo, '') AS tipo,
        u.username,
        m.photo_url,
        m.verificado,
        m.doc_identidad_url,
        m.doc_antecedentes_url,
        m.doc_residencia_url,
        cs.color AS categoria_color,
        COALESCE(m.verificado, FALSE) AS verificado,
        COALESCE(ROUND(AVG(v.rating)::numeric, 1), 0) AS rating,
        COUNT(v.id)::integer                           AS reviews
      FROM medicos m
      JOIN usuarios u ON u.id = m.usuario_medico_id
      LEFT JOIN categorias_salud cs ON cs.id = m.categorias_salud_id
                                    OR (m.categorias_salud_id IS NULL AND LOWER(cs.nombre) = LOWER(translate(m.tipo, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')))
      LEFT JOIN valoraciones_medico v ON v.usuario_medico_id = m.id
      WHERE COALESCE(m.docs_estado, 'pendiente') = 'aprobado' AND COALESCE(m.plan_activo, FALSE) = TRUE
      GROUP BY m.id, u.id, m.especialidad, m.tag, m.horario, m.tipo, m.categorias_salud_id, u.username, m.photo_url, cs.nombre, cs.color, m.verificado
      ORDER BY m.id
    `;

    const result = await pool.query(query);

    const medicos = result.rows.map((m: Record<string, unknown>) => {
      const name     = String(m.username ?? "");
      const photoUrl = m.photo_url ? String(m.photo_url) : null;
      const isValidPhoto = photoUrl && (
        photoUrl.startsWith("/") ||
        photoUrl.startsWith("http") ||
        photoUrl.startsWith("data:image/")
      );

      return {
        id:                  Number(m.id),
        cuidador_usuario_id: Number(m.cuidador_usuario_id),
        name,
        specialty: String(m.especialidad ?? ""),
        tag:       String(m.tag          ?? ""),
        hours:     String(m.horario      ?? ""),
        rating:    parseFloat(String(m.rating ?? "0")),
        reviews:   Number(m.reviews      ?? 0),
        tipo:      String(m.tipo         ?? ""),
        photo:      isValidPhoto ? photoUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2A7A6A&color=fff&size=200`,
        color:      String(m.categoria_color ?? "#2A7A6A"),
        verificado: Boolean(m.verificado),
      };
    });
    
    return NextResponse.json({ medicos });
  } catch (err) {
    console.error("Error al obtener médicos:", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, verificado, doc_identidad_url, doc_antecedentes_url, doc_residencia_url } = body;
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await pool.query(
      `UPDATE medicos SET
        verificado            = COALESCE($1, verificado),
        doc_identidad_url     = COALESCE($2, doc_identidad_url),
        doc_antecedentes_url  = COALESCE($3, doc_antecedentes_url),
        doc_residencia_url    = COALESCE($4, doc_residencia_url)
       WHERE id = $5`,
      [
        verificado            !== undefined ? verificado : null,
        doc_identidad_url     ?? null,
        doc_antecedentes_url  ?? null,
        doc_residencia_url    ?? null,
        id,
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error al actualizar verificación:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}