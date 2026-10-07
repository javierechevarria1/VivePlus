-- ============================================================
-- Migración 011: Crear tabla de anuncios publicitarios
-- Ejecutar en la base de datos PostgreSQL
-- ============================================================

CREATE TABLE IF NOT EXISTS anuncios (
  id SERIAL PRIMARY KEY,
  empresa VARCHAR(255) NOT NULL,
  imagen TEXT NOT NULL,
  url_destino TEXT NOT NULL,
  ubicacion VARCHAR(50) NOT NULL, -- ej: 'home', 'productos', 'actividades'
  clics INTEGER DEFAULT 0,
  impresiones INTEGER DEFAULT 0,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  fecha_fin DATE,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Insertar un par de anuncios de prueba si la tabla está vacía
INSERT INTO anuncios (empresa, imagen, url_destino, ubicacion, activo)
SELECT 'VitalPlus Fisioterapia', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80', 'https://example.com/fisioterapia', 'actividades', true
WHERE NOT EXISTS (SELECT 1 FROM anuncios LIMIT 1);

INSERT INTO anuncios (empresa, imagen, url_destino, ubicacion, activo)
SELECT 'Audífonos ClaroSound', 'https://images.unsplash.com/photo-1598555355620-64d90df81e3a?w=800&q=80', 'https://example.com/audifonos', 'productos', true
WHERE NOT EXISTS (SELECT 1 FROM anuncios LIMIT 1);