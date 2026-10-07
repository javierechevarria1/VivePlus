-- Cache de la capability "transfers" de la cuenta Stripe Connect del vendedor.
-- Evita una llamada a stripe.accounts.retrieve por vendedor al listar el catálogo.
-- La mantiene al día el webhook account.updated; se refresca también al publicar.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_usuarios_payouts_enabled
  ON usuarios (stripe_payouts_enabled) WHERE stripe_connect_id IS NOT NULL;
