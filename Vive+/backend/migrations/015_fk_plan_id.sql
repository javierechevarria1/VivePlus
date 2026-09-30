-- Migración 015: plan_id FK en usuarios y medicos

-- usuarios: puede que la columna ya exista sin FK, la añadimos con FK
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS plan_id INTEGER REFERENCES planes(id) ON DELETE SET NULL;

-- medicos: añadir plan_id FK (plan_activo se mantiene por compatibilidad)
ALTER TABLE medicos
  ADD COLUMN IF NOT EXISTS plan_id INTEGER REFERENCES planes(id) ON DELETE SET NULL;
