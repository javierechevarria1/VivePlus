-- Crear tabla facturas con estructura simple
CREATE TABLE IF NOT EXISTS facturas (
  id SERIAL PRIMARY KEY,
  stripe_payment_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_facturas_stripe_payment_id ON facturas(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_facturas_created_at ON facturas(created_at);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_facturas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS trigger_update_facturas_updated_at ON facturas;
CREATE TRIGGER trigger_update_facturas_updated_at
BEFORE UPDATE ON facturas
FOR EACH ROW
EXECUTE FUNCTION update_facturas_updated_at();
