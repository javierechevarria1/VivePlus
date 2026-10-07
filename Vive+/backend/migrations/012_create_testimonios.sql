-- ============================================================
-- Migración 012: Crear tabla de testimonios
-- ============================================================

CREATE TABLE IF NOT EXISTS testimonios (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  vinculo VARCHAR(100) NOT NULL, -- Ej: 'Hijo', 'Cuidador', etc.
  texto TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Insertar testimonios de prueba si está vacía
INSERT INTO testimonios (vinculo, texto, rating)
SELECT 'Hija de usuario', 'El pastillero inteligente nos ha dado muchísima tranquilidad. Ahora sé que mi padre toma su medicación a tiempo.', 5
WHERE NOT EXISTS (SELECT 1 FROM testimonios LIMIT 1);

INSERT INTO testimonios (vinculo, texto, rating)
SELECT 'Familiar', 'Excelente servicio al cliente y envío súper rápido. Compré la tablet senior y es muy fácil de usar.', 5
WHERE NOT EXISTS (SELECT 1 FROM testimonios LIMIT 1);