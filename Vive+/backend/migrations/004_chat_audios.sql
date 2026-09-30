CREATE TABLE IF NOT EXISTS chat_audios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  datos       BYTEA       NOT NULL,
  mime_type   VARCHAR(50) NOT NULL DEFAULT 'audio/webm',
  duracion_seg DECIMAL(8,2),
  creado_en   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE chat_mensajes
  ADD COLUMN IF NOT EXISTS audio_id UUID REFERENCES chat_audios(id);
