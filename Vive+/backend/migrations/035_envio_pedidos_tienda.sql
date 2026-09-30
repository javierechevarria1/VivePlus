-- ============================================================
-- Migración 035: envío de los pedidos de la tienda
--
-- Hasta ahora un pedido pagado se quedaba en 'activa' para siempre: el
-- comprador nunca sabía si se le había enviado. Con estas columnas el
-- pedido tiene ciclo (activa → enviada → entregada) y guarda su etiqueta
-- y su seguimiento.
--
-- Van en `orden` y no en una tabla aparte porque un pedido de la tienda
-- es un único paquete: siempre sale del mismo sitio y va a un solo destino.
--
-- A diferencia de segunda mano, la etiqueta NO se crea al cobrar sino
-- cuando se prepara el paquete: hasta entonces no se sabe si el stock
-- real da, cuánto pesa de verdad, ni si el comprador va a cancelar.
-- ============================================================

ALTER TABLE orden
  -- NULL mientras el pedido está pendiente de preparar, o si la creación
  -- de la etiqueta falló y hay que enviarlo a mano.
  ADD COLUMN IF NOT EXISTS sendcloud_id        VARCHAR(64),
  ADD COLUMN IF NOT EXISTS etiqueta_url        TEXT,
  ADD COLUMN IF NOT EXISTS seguimiento         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS seguimiento_url     TEXT,
  ADD COLUMN IF NOT EXISTS transportista       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS estado_envio        VARCHAR(80),
  ADD COLUMN IF NOT EXISTS motivo_sin_etiqueta TEXT,
  ADD COLUMN IF NOT EXISTS enviado_en          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS entregado_en        TIMESTAMPTZ;

-- El webhook identifica el paquete, no el pedido: hay que poder encontrarlo
-- por ese id en cada actualización de estado.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orden_sendcloud
  ON orden (sendcloud_id)
  WHERE sendcloud_id IS NOT NULL;

-- El panel de administración filtra por aquí para saber qué queda por enviar.
CREATE INDEX IF NOT EXISTS idx_orden_estado ON orden (estado);
