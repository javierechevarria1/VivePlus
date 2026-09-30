-- Índices para las consultas de mayor tráfico: chat, login y búsqueda de cercanía.
CREATE INDEX IF NOT EXISTS idx_chat_mensajes_chat_id ON chat_mensajes (chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_participantes ON chat (usuario_escritor_id, usuario_receptor_id);

CREATE INDEX IF NOT EXISTS idx_usuarios_email_lower ON usuarios (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_usuarios_username_lower ON usuarios (LOWER(username));

CREATE INDEX IF NOT EXISTS idx_usuarios_latlng ON usuarios (latitud, longitud)
  WHERE latitud IS NOT NULL AND longitud IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_medicos_usuario_medico_id ON medicos (usuario_medico_id);
CREATE INDEX IF NOT EXISTS idx_valoraciones_medico_usuario_medico_id ON valoraciones_medico (usuario_medico_id);
