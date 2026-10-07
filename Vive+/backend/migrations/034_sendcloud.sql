-- ============================================================
-- Migración 034: etiqueta de envío generada por la plataforma
--
-- Hasta ahora el vendedor pagaba el porte y anotaba el seguimiento a
-- mano. Con la etiqueta prepagada la plataforma compra el transporte,
-- le manda la etiqueta ya pagada y el seguimiento llega solo.
-- ============================================================

ALTER TABLE ventas_segunda_mano
  -- Identificador del envío en Sendcloud. NULL significa que esta venta va
  -- por el camino manual: o no había credenciales, o la creación falló y
  -- el vendedor tiene que enviarlo por su cuenta.
  ADD COLUMN IF NOT EXISTS sendcloud_id     VARCHAR(64),
  ADD COLUMN IF NOT EXISTS etiqueta_url     TEXT,
  ADD COLUMN IF NOT EXISTS seguimiento_url  TEXT,
  -- Último estado que ha comunicado el transportista, tal cual lo manda.
  -- Se guarda en crudo para poder depurar por qué una venta no avanzó.
  ADD COLUMN IF NOT EXISTS estado_envio     VARCHAR(80),
  ADD COLUMN IF NOT EXISTS motivo_sin_etiqueta TEXT;

-- El webhook llega identificando el paquete, no la venta: hay que poder
-- encontrarla por ese id en cada actualización de estado.
CREATE UNIQUE INDEX IF NOT EXISTS idx_ventas_sm_sendcloud
  ON ventas_segunda_mano (sendcloud_id)
  WHERE sendcloud_id IS NOT NULL;
