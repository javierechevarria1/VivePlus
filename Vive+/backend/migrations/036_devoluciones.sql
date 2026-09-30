-- ============================================================
-- Migración 036: devoluciones y reembolsos
--
-- Vender la plataforma sus propios productos a un consumidor es B2C, y eso
-- obliga a aceptar la devolución sin motivo durante 14 días desde la
-- entrega (derecho de desistimiento). Hasta ahora no había forma de pedirla
-- ni de devolver el dinero salvo entrando a mano en el panel de Stripe.
--
-- La misma tabla sirve para las incidencias de segunda mano —producto que
-- no llega o llega roto—, que es justo para lo que se cobra la comisión de
-- gestión. Por eso apunta a un pedido o a una venta, nunca a los dos.
-- ============================================================

CREATE TABLE IF NOT EXISTS devoluciones (
  id              SERIAL PRIMARY KEY,

  orden_id        INTEGER REFERENCES orden(id),
  venta_id        INTEGER REFERENCES ventas_segunda_mano(id),
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),

  -- desistimiento: B2C sin motivo, dentro de plazo.
  -- incidencia:    no llegó, llegó roto o no es lo que se compró.
  tipo            VARCHAR(20) NOT NULL DEFAULT 'desistimiento',
  motivo          TEXT,

  -- solicitada → aceptada → reembolsada
  --           ↘ rechazada
  estado          VARCHAR(20) NOT NULL DEFAULT 'solicitada',
  respuesta       TEXT,

  importe_solicitado  NUMERIC(10,2),
  importe_reembolsado NUMERIC(10,2),
  stripe_refund_id    VARCHAR(255),

  creado_en       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resuelto_en     TIMESTAMPTZ,
  reembolsado_en  TIMESTAMPTZ,

  -- Una devolución es de un pedido o de una venta, pero no de ambos ni de
  -- ninguno: sin esto se podrían colar filas huérfanas.
  CONSTRAINT devolucion_tiene_origen CHECK (
    (orden_id IS NOT NULL AND venta_id IS NULL) OR
    (orden_id IS NULL AND venta_id IS NOT NULL)
  )
);

-- No se puede pedir dos veces la devolución de lo mismo mientras la primera
-- siga abierta. Los índices son parciales para permitir volver a pedirla si
-- la anterior se rechazó.
CREATE UNIQUE INDEX IF NOT EXISTS idx_devolucion_orden_abierta
  ON devoluciones (orden_id)
  WHERE orden_id IS NOT NULL AND estado IN ('solicitada', 'aceptada');

CREATE UNIQUE INDEX IF NOT EXISTS idx_devolucion_venta_abierta
  ON devoluciones (venta_id)
  WHERE venta_id IS NOT NULL AND estado IN ('solicitada', 'aceptada');

CREATE INDEX IF NOT EXISTS idx_devoluciones_estado ON devoluciones (estado);
CREATE INDEX IF NOT EXISTS idx_devoluciones_usuario ON devoluciones (usuario_id);
