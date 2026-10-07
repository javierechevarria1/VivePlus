-- Columnas que hasta ahora solo se creaban en tiempo de request (ALTER TABLE en cada
-- llamada a perfil.ts, salud.ts, admin-salud.ts). El resto de columnas usadas por esas
-- rutas (doc_identidad_url, doc_antecedentes_url, doc_residencia_url, docs_estado,
-- verificado, plan_id, stripe_customer_id) ya están cubiertas por migraciones previas.
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto TEXT;
