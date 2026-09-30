-- Migración 019: vincular anuncios con organizaciones para poder desactivarlos si cancela el plan
ALTER TABLE anuncios
  ADD COLUMN IF NOT EXISTS organizacion_id INTEGER REFERENCES organizaciones(id) ON DELETE SET NULL;
