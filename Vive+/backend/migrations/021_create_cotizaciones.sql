-- ============================================================
-- Migración 021: Crear tabla de cotizaciones
-- ============================================================

CREATE TABLE IF NOT EXISTS cotizaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  descripcion TEXT,
  necesidades JSONB NOT NULL DEFAULT '[]'::jsonb,
  productos_sugeridos JSONB NOT NULL DEFAULT '[]'::jsonb,
  creado_en TIMESTAMP DEFAULT NOW()
);
