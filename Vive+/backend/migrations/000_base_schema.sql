-- Esquema inicial reconstruido a partir de las consultas de la aplicación.
-- Ejecutar solo en una base nueva; no reemplaza un backup del servidor original.

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password TEXT,
  edad INTEGER,
  rol INTEGER NOT NULL DEFAULT 1,
  sexo VARCHAR(30),
  foto TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_acceso TIMESTAMPTZ,
  estado_online BOOLEAN NOT NULL DEFAULT FALSE,
  session_id TEXT,
  latitud DOUBLE PRECISION,
  longitud DOUBLE PRECISION,
  direccion TEXT,
  cp VARCHAR(20),
  ciudad VARCHAR(100),
  provincia VARCHAR(100),
  telefono VARCHAR(30),
  stripe_customer_id TEXT,
  stripe_connect_id TEXT,
  onboarding_completado BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS medicos (
  id SERIAL PRIMARY KEY,
  usuario_medico_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  email VARCHAR(255),
  password TEXT,
  tag VARCHAR(100),
  horario TEXT,
  tipo VARCHAR(100),
  especialidad VARCHAR(255),
  categorias_salud_id INTEGER,
  photo_url TEXT,
  verificado BOOLEAN NOT NULL DEFAULT FALSE,
  docs_estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  doc_identidad_url TEXT,
  doc_antecedentes_url TEXT,
  doc_residencia_url TEXT,
  plan_activo BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_customer_id TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT medicos_usuario_medico_id_key UNIQUE (usuario_medico_id)
);

CREATE TABLE IF NOT EXISTS organizaciones (
  id SERIAL PRIMARY KEY,
  usuario_organizacion_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  organizaciones_categoria_id INTEGER,
  nombre VARCHAR(255),
  tipo VARCHAR(50),
  descripcion TEXT,
  web TEXT,
  email VARCHAR(255),
  telefono VARCHAR(30),
  direccion TEXT,
  ciudad VARCHAR(100),
  logo_url TEXT,
  estado VARCHAR(30) NOT NULL DEFAULT 'activa',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS servicios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS organizacion_servicios (
  organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
  servicios_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
  PRIMARY KEY (organizacion_id, servicios_id)
);

CREATE TABLE IF NOT EXISTS actividades (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  categoria VARCHAR(100),
  actividades_categoria_id INTEGER,
  fecha TIMESTAMPTZ,
  lugar TEXT,
  plazas_max INTEGER NOT NULL DEFAULT 0,
  total_inscritos INTEGER NOT NULL DEFAULT 0,
  duracion_min INTEGER,
  url_lugar TEXT,
  url_mas_info TEXT,
  imagen TEXT,
  estado VARCHAR(30) NOT NULL DEFAULT 'activa',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS actividad_inscripciones (
  id SERIAL PRIMARY KEY,
  actividad_id INTEGER NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_inscripcion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT actividad_inscripciones_actividad_usuario_key UNIQUE (actividad_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS usuarios_dependientes (
  id SERIAL PRIMARY KEY,
  usuario_intermediario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  usuario_dependiente_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  ciudad VARCHAR(100),
  situacion_convivencial VARCHAR(100),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat (
  id SERIAL PRIMARY KEY,
  usuario_escritor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  usuario_receptor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chat_participantes_distintos CHECK (usuario_escritor_id <> usuario_receptor_id)
);

CREATE TABLE IF NOT EXISTS chat_mensajes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  texto TEXT,
  chat_id INTEGER NOT NULL REFERENCES chat(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  leido BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS codigos_invitacion_medico (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(100) NOT NULL UNIQUE,
  estado BOOLEAN NOT NULL DEFAULT FALSE,
  usado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS valoraciones_medico (
  id SERIAL PRIMARY KEY,
  usuario_medico_id INTEGER NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  rating NUMERIC(2,1) NOT NULL,
  comentario TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valoraciones_medico_rating_check CHECK (rating >= 1 AND rating <= 5)
);

CREATE TABLE IF NOT EXISTS solicitudes_cercania (
  id SERIAL PRIMARY KEY,
  usuario_emisor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  usuario_receptor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT solicitudes_cercania_participantes_distintos CHECK (usuario_emisor_id <> usuario_receptor_id)
);

CREATE TABLE IF NOT EXISTS amigos_cercania (
  id SERIAL PRIMARY KEY,
  solicitudes_id INTEGER REFERENCES solicitudes_cercania(id) ON DELETE CASCADE,
  usuario1_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  usuario2_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT amigos_cercania_usuarios_distintos CHECK (usuario1_id <> usuario2_id),
  CONSTRAINT amigos_cercania_usuarios_key UNIQUE (usuario1_id, usuario2_id)
);

CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio NUMERIC(10,2),
  categoria VARCHAR(100),
  productos_categoria_id INTEGER,
  imagen TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  tamano_paquete VARCHAR(1) NOT NULL DEFAULT 'M',
  stripe_price_id TEXT,
  stripe_producto_id TEXT,
  id_vendedor INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  segunda_mano BOOLEAN NOT NULL DEFAULT FALSE,
  es_tecnologia BOOLEAN NOT NULL DEFAULT FALSE,
  estado VARCHAR(20) NOT NULL DEFAULT 'disponible',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS producto_specs (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL,
  etiqueta TEXT NOT NULL,
  valor TEXT
);

CREATE TABLE IF NOT EXISTS producto_destacados (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL,
  texto TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS carrito_items (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  producto_id INTEGER,
  owner_key TEXT,
  nombre VARCHAR(255) NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day'),
  precio NUMERIC(10,2),
  imagen TEXT,
  categoria VARCHAR(100),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stripe_customers (
  id SERIAL PRIMARY KEY,
  id_stripe VARCHAR(255) NOT NULL UNIQUE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  estado VARCHAR(30) NOT NULL DEFAULT 'activo',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transacciones (
  id SERIAL PRIMARY KEY,
  stripe_customer_id INTEGER REFERENCES stripe_customers(id) ON DELETE SET NULL,
  importe NUMERIC(10,2) NOT NULL DEFAULT 0,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  tipo VARCHAR(50),
  motivo TEXT,
  factura_id INTEGER,
  CONSTRAINT transacciones_estado_check CHECK (estado IN ('correcto', 'incorrecto'))
);

CREATE TABLE IF NOT EXISTS suscripcion (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  estado VARCHAR(30) NOT NULL DEFAULT 'inactivo',
  fecha_ini TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  transaccion_id INTEGER REFERENCES transacciones(id) ON DELETE SET NULL,
  plan_id INTEGER,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medico_pagos (
  id SERIAL PRIMARY KEY,
  medico_id INTEGER NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  cantidad NUMERIC(10,2) NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orden (
  id SERIAL PRIMARY KEY,
  usr_comprador_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  precio_total NUMERIC(10,2) NOT NULL,
  direccion_envio TEXT,
  comision NUMERIC(10,2) NOT NULL DEFAULT 0,
  estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  transaccion_id INTEGER REFERENCES transacciones(id) ON DELETE SET NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orden_item (
  id SERIAL PRIMARY KEY,
  orden_id INTEGER NOT NULL REFERENCES orden(id) ON DELETE CASCADE,
  producto_id INTEGER,
  cantidad INTEGER NOT NULL DEFAULT 1,
  descuento NUMERIC(10,2) NOT NULL DEFAULT 0,
  precio_items NUMERIC(10,2) NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
