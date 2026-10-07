-- Migración 018: planes de organización y visibilidad condicional

-- Columna que vincula una organización con el plan que contrató
ALTER TABLE organizaciones
  ADD COLUMN IF NOT EXISTS plan_org_id INTEGER REFERENCES planes(id) ON DELETE SET NULL;

-- Scope en planes para distinguir a quién va dirigido cada plan
ALTER TABLE planes
  ADD COLUMN IF NOT EXISTS scope VARCHAR(30) NOT NULL DEFAULT 'usuario';

-- Insertar los dos planes de organización
INSERT INTO planes (nombre, precio, intervalo, caracteristicas, scope)
VALUES
  (
    'Ficha Básica',
    29.00,
    'mensual',
    '["Perfil visible en el directorio de organizaciones","Ficha de empresa completa","Datos de contacto visibles para los usuarios"]'::jsonb,
    'organizacion'
  ),
  (
    'Pack Ficha + Banner',
    59.00,
    'mensual',
    '["Todo lo incluido en Ficha Básica","Banner publicitario en la sección de organizaciones","Mayor visibilidad y alcance","Logo y enlace web destacados en la página"]'::jsonb,
    'organizacion'
  )
ON CONFLICT DO NOTHING;
