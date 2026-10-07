ALTER TABLE transacciones DROP CONSTRAINT transacciones_estado_check;
ALTER TABLE transacciones ADD CONSTRAINT transacciones_estado_check
  CHECK (estado IN ('correcto', 'incorrecto', 'pendiente'));
