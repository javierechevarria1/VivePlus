-- Migración 014: tabla planes y pagos_planes

CREATE TABLE IF NOT EXISTS planes (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  precio          NUMERIC(10, 2) NOT NULL,
  intervalo       VARCHAR(20) NOT NULL CHECK (intervalo IN ('mensual', 'anual')),
  caracteristicas JSONB,
  stripe_price_id TEXT UNIQUE,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagos_planes (
  id          SERIAL PRIMARY KEY,
  plan_id     INTEGER NOT NULL REFERENCES planes(id),
  entidad_id  INTEGER NOT NULL,
  entidad_tipo VARCHAR(20) NOT NULL CHECK (entidad_tipo IN ('medico', 'usuario', 'organizacion')),
  pagado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  precio       NUMERIC(10, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pagos_planes_entidad ON pagos_planes (entidad_tipo, entidad_id);
CREATE INDEX IF NOT EXISTS idx_pagos_planes_plan ON pagos_planes (plan_id);
