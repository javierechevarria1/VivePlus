-- Migración 005: tabla logins si no existe
CREATE TABLE IF NOT EXISTS logins (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL,
  estado      VARCHAR(10) NOT NULL,
  rol         INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
