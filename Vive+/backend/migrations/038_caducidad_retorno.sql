-- ============================================================
-- Migración 038: plazo del paquete de vuelta
--
-- Una devolución aceptada cuyo paquete no sale nunca se quedaba esperando
-- indefinidamente: el pedido no se cerraba, la etiqueta comprada se perdía
-- sin que nadie lo supiera, y el comprador no podía volver a pedirla porque
-- seguía figurando como abierta.
--
-- Ahora la aceptación lleva fecha límite. Vencida, un barrido diario la
-- cierra como 'caducada' y avisa a las dos partes. No se reembolsa nada:
-- el producto no ha vuelto.
--
-- 'caducada' queda fuera de los índices de devolución abierta a propósito,
-- para que el comprador pueda volver a pedirla si se le pasó el plazo.
-- ============================================================

ALTER TABLE devoluciones
  -- Se sella al aceptar. NULL en las devoluciones que se reembolsan directas,
  -- que no esperan ningún paquete.
  ADD COLUMN IF NOT EXISTS limite_retorno TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS caducado_en    TIMESTAMPTZ;

-- El barrido busca por plazo vencido entre las que esperan paquete.
CREATE INDEX IF NOT EXISTS idx_devolucion_limite_retorno
  ON devoluciones (limite_retorno)
  WHERE estado = 'aceptada' AND limite_retorno IS NOT NULL;
