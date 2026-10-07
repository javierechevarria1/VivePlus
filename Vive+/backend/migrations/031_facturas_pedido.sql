-- Vincula cada factura con su comprador y su pedido, y cachea los datos que
-- Stripe emite al finalizar la factura (numero correlativo y enlaces al PDF).
-- Sin estas columnas no habia forma de saber que factura pertenece a que usuario:
-- la tabla solo guardaba el payment intent y el JSON crudo.
ALTER TABLE facturas
  ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS orden_id INTEGER REFERENCES orden(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS numero VARCHAR(255),
  ADD COLUMN IF NOT EXISTS importe NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS hosted_invoice_url TEXT,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

CREATE INDEX IF NOT EXISTS idx_facturas_usuario_id ON facturas(usuario_id);

-- Un pedido tiene como mucho una factura. El indice unico permite deduplicar por
-- orden_id cuando el mismo pago llega dos veces por caminos distintos
-- (checkout.session.completed con el payment intent e invoice.paid con la factura).
CREATE UNIQUE INDEX IF NOT EXISTS idx_facturas_orden_id
  ON facturas(orden_id) WHERE orden_id IS NOT NULL;
