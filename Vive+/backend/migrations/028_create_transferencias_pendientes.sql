CREATE TABLE IF NOT EXISTS transferencias_pendientes (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER,
  vendedor_id INTEGER NOT NULL REFERENCES usuarios(id),
  importe NUMERIC NOT NULL,
  motivo TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
