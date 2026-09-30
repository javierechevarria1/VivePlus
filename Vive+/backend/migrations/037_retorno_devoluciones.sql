-- ============================================================
-- Migración 037: el viaje de vuelta de una devolución
--
-- Hasta ahora una devolución solo movía dinero: se aceptaba y se
-- reembolsaba en el mismo clic, y el producto volvía —o no— por fuera del
-- sistema. Con estas columnas la devolución tiene su propio envío, igual
-- que lo tiene el pedido de ida, y el ciclo se cierra:
--
--   solicitada → aceptada → recibida → reembolsada
--             ↘ rechazada
--
-- `aceptada` ya existía en la tabla pero no la escribía nadie. Ahora es el
-- tramo en el que hay etiqueta de retorno emitida y se espera el paquete.
--
-- El porte de la vuelta lo paga la plataforma: solo se le puede cobrar al
-- comprador si se le informó antes de comprar, y ese texto legal todavía no
-- existe.
-- ============================================================

ALTER TABLE devoluciones
  -- Envío de vuelta: mismas columnas que la ida en `orden`, porque es el
  -- mismo paquete recorriendo el mismo camino al revés.
  ADD COLUMN IF NOT EXISTS sendcloud_id        VARCHAR(64),
  ADD COLUMN IF NOT EXISTS etiqueta_url        TEXT,
  ADD COLUMN IF NOT EXISTS seguimiento         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS seguimiento_url     TEXT,
  ADD COLUMN IF NOT EXISTS transportista       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS estado_envio        VARCHAR(80),
  -- NULL si la etiqueta salió bien. Si falló, aquí queda por qué, y la
  -- devolución se puede reintentar sin perder la solicitud.
  ADD COLUMN IF NOT EXISTS motivo_sin_etiqueta TEXT,
  ADD COLUMN IF NOT EXISTS aceptado_en         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recibido_en         TIMESTAMPTZ;

-- El webhook del transportista identifica el paquete, no la devolución.
CREATE UNIQUE INDEX IF NOT EXISTS idx_devolucion_sendcloud
  ON devoluciones (sendcloud_id)
  WHERE sendcloud_id IS NOT NULL;

-- Los índices que impiden pedir dos veces la misma devolución solo contaban
-- 'solicitada' y 'aceptada'. Con el tramo de vuelta hay un estado más en el
-- que la devolución sigue abierta, y sin incluirlo se podría abrir otra
-- mientras el paquete viaja.
DROP INDEX IF EXISTS idx_devolucion_orden_abierta;
DROP INDEX IF EXISTS idx_devolucion_venta_abierta;

CREATE UNIQUE INDEX IF NOT EXISTS idx_devolucion_orden_abierta
  ON devoluciones (orden_id)
  WHERE orden_id IS NOT NULL AND estado IN ('solicitada', 'aceptada', 'recibida');

CREATE UNIQUE INDEX IF NOT EXISTS idx_devolucion_venta_abierta
  ON devoluciones (venta_id)
  WHERE venta_id IS NOT NULL AND estado IN ('solicitada', 'aceptada', 'recibida');
