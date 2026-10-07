ALTER TABLE carrito_items ALTER COLUMN usuario_id DROP NOT NULL;
ALTER TABLE carrito_items ADD COLUMN IF NOT EXISTS owner_key TEXT;
UPDATE carrito_items
  SET owner_key = CONCAT('u:', usuario_id::text)
  WHERE owner_key IS NULL AND usuario_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_carrito_owner_key ON carrito_items (owner_key);
