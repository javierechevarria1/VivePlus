-- ============================================================
-- Migración 009: Tablas de categorías dinámicas
-- Ejecutar una sola vez en la base de datos PostgreSQL
-- ============================================================

-- Actividades
CREATE TABLE IF NOT EXISTS categorias_actividades (
  id      SERIAL       PRIMARY KEY,
  nombre  VARCHAR(100) NOT NULL UNIQUE,
  color   VARCHAR(20)  NOT NULL DEFAULT '#2A7A6A',
  icono   VARCHAR(50)  NOT NULL DEFAULT 'Tag',
  orden   SMALLINT     NOT NULL DEFAULT 0,
  activa  BOOLEAN      NOT NULL DEFAULT true
);

INSERT INTO categorias_actividades (nombre, color, icono, orden) VALUES
  ('Salud',      '#E74C3C', 'HeartPulse',   1),
  ('Deporte',    '#2A7A6A', 'Dumbbell',     2),
  ('Naturaleza', '#27AE60', 'Leaf',         3),
  ('Arte',       '#9B59B6', 'Palette',      4),
  ('Cultura',    '#2563EB', 'Landmark',     5),
  ('Ocio',       '#C9923A', 'Coffee',       6),
  ('Formación',  '#7B5EA7', 'GraduationCap', 7),
  ('Tecnología', '#2563EB', 'Laptop',          8)
ON CONFLICT (nombre) DO NOTHING;

-- Productos
CREATE TABLE IF NOT EXISTS categorias_productos (
  id        SERIAL       PRIMARY KEY,
  nombre    VARCHAR(100) NOT NULL UNIQUE,
  color     VARCHAR(20)  NOT NULL DEFAULT '#2A7A6A',
  gradiente TEXT         NOT NULL DEFAULT '',
  icono     VARCHAR(50)  NOT NULL DEFAULT 'Tag',
  orden     SMALLINT     NOT NULL DEFAULT 0,
  activa    BOOLEAN      NOT NULL DEFAULT true
);

INSERT INTO categorias_productos (nombre, color, gradiente, icono, orden) VALUES
  ('Salud',        '#E74C3C', 'linear-gradient(135deg, #fff0f0 0%, #fff5f5 100%)', 'HeartPulse',    1),
  ('Tecnología',   '#2563EB', 'linear-gradient(135deg, #f3eeff 0%, #f8f5ff 100%)', 'Laptop',        2),
  ('Seguridad',    '#27AE60', 'linear-gradient(135deg, #e8f5f2 0%, #f0f8f6 100%)', 'ShieldCheck',   3),
  ('Movilidad',    '#9B59B6', 'linear-gradient(135deg, #e8f0ff 0%, #f0f5ff 100%)', 'Activity',      4),
  ('Confort',      '#F39C12', 'linear-gradient(135deg, #fff6e8 0%, #fff9f0 100%)', 'Sofa',          5),
  ('Vision',       '#1ABC9C', 'linear-gradient(135deg, #e8fbf7 0%, #f2fcfa 100%)', 'Eye',           6),
  ('Comunicacion', '#E67E22', 'linear-gradient(135deg, #fff1e6 0%, #fff6f0 100%)', 'MessageCircle', 7)
ON CONFLICT (nombre) DO NOTHING;

-- Organizaciones
CREATE TABLE IF NOT EXISTS categorias_organizaciones (
  id         SERIAL      PRIMARY KEY,
  key        VARCHAR(50) NOT NULL UNIQUE,
  label      VARCHAR(100) NOT NULL,
  bg_color   VARCHAR(20) NOT NULL DEFAULT '#EAF5F2',
  text_color VARCHAR(20) NOT NULL DEFAULT '#2A7A6A',
  color      VARCHAR(20) NOT NULL DEFAULT '#2A7A6A',
  icono      VARCHAR(50) NOT NULL DEFAULT 'Users',
  orden      SMALLINT    NOT NULL DEFAULT 0,
  activa     BOOLEAN     NOT NULL DEFAULT true
);

INSERT INTO categorias_organizaciones (key, label, bg_color, text_color, color, icono, orden) VALUES
  ('ong',       'ONG',       '#FFF0F0', '#C0392B', '#E74C3C', 'Heart',     1),
  ('fundacion', 'Fundación', '#EEF4FF', '#2563EB', '#2563EB', 'Shield',    2),
  ('empresa',   'Empresa',   '#E8F8F5', '#27AE60', '#27AE60', 'Building2', 3)
ON CONFLICT (key) DO NOTHING;

-- Salud (tipos de cuidadores)
CREATE TABLE IF NOT EXISTS categorias_salud (
  id      SERIAL       PRIMARY KEY,
  nombre  VARCHAR(100) NOT NULL UNIQUE,
  color   VARCHAR(20)  NOT NULL DEFAULT '#9B59B6',
  orden   SMALLINT     NOT NULL DEFAULT 0,
  activa  BOOLEAN      NOT NULL DEFAULT true
);

INSERT INTO categorias_salud (nombre, color, orden) VALUES
  ('medico',         '#E74C3C', 1),
  ('enfermero',      '#2563EB', 2),
  ('fisioterapeuta', '#27AE60', 3),
  ('psicologo',      '#9B59B6', 4),
  ('nutricionista',  '#F39C12', 5),
  ('cuidador',       '#1ABC9C', 6)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- Foreign keys: conectar tablas principales con sus categorías
-- ============================================================

ALTER TABLE actividades
  ADD CONSTRAINT fk_actividades_categoria
  FOREIGN KEY (categoria) REFERENCES categorias_actividades(nombre)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE productos
  ADD CONSTRAINT fk_productos_categoria
  FOREIGN KEY (categoria) REFERENCES categorias_productos(nombre)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE organizaciones
  ADD CONSTRAINT fk_organizaciones_tipo
  FOREIGN KEY (tipo) REFERENCES categorias_organizaciones(key)
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE medicos
  ADD CONSTRAINT fk_medicos_tipo
  FOREIGN KEY (tipo) REFERENCES categorias_salud(nombre)
  ON UPDATE CASCADE ON DELETE RESTRICT;
