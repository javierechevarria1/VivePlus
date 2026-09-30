ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS onboarding_completado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono VARCHAR(30);

ALTER TABLE usuarios_dependientes ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100);
ALTER TABLE usuarios_dependientes ADD COLUMN IF NOT EXISTS situacion_convivencial VARCHAR(100);

CREATE TABLE IF NOT EXISTS dependencia_perfil (
  id                     SERIAL PRIMARY KEY,
  usuario_dependiente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  autonomia              VARCHAR(20),
  discapacidades         TEXT[],
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(usuario_dependiente_id)
);
