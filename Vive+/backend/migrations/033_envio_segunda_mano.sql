-- ============================================================
-- Migración 033: los dos datos que faltaban para poder enviar
--
-- Hasta ahora el envío se cobraba siempre al tramo intermedio y no se
-- sabía desde dónde sale el paquete. Con estos dos campos la tarifa
-- pasa a depender del tamaño real y el vendedor tiene dirección de
-- recogida, que es lo que necesitará el transportista en la fase 3.
-- ============================================================

-- Tramo de tarifa del paquete: S, M o L.
-- Se deja NULL a propósito en vez de poner 'M' por defecto: NULL es la
-- señal de "producto publicado antes del cambio, hay que preguntárselo
-- al vendedor". Un default silencioso escondería justo eso.
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS tamano_paquete VARCHAR(1);

ALTER TABLE productos
  DROP CONSTRAINT IF EXISTS productos_tamano_paquete_check;
ALTER TABLE productos
  ADD CONSTRAINT productos_tamano_paquete_check
  CHECK (tamano_paquete IS NULL OR tamano_paquete IN ('S', 'M', 'L'));

-- Índice parcial para el aviso de "completa tus productos": solo interesan
-- los de segunda mano a los que les falta el dato.
CREATE INDEX IF NOT EXISTS idx_productos_sin_tamano
  ON productos (id_vendedor)
  WHERE segunda_mano = true AND tamano_paquete IS NULL;

-- Dirección de recogida del vendedor. Va en usuarios y no en cada producto
-- porque es la misma para todo lo que publique.
-- telefono se añade aquí porque el transportista lo exige para avisar de la
-- recogida; perfil.ts ya intentaba guardarlo contra una columna inexistente.
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS telefono   VARCHAR(20),
  ADD COLUMN IF NOT EXISTS direccion  TEXT,
  ADD COLUMN IF NOT EXISTS cp         VARCHAR(10),
  ADD COLUMN IF NOT EXISTS ciudad     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS provincia  VARCHAR(100);
