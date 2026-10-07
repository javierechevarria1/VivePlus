CREATE TABLE IF NOT EXISTS productos_segunda_mano (
  id SERIAL PRIMARY KEY,
  vendedor_id INTEGER NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio_original NUMERIC(10,2) NOT NULL,
  comision NUMERIC(10,2) NOT NULL,
  precio_final NUMERIC(10,2) NOT NULL,
  estado VARCHAR(50) DEFAULT 'disponible',
  imagen TEXT,
  creado_en TIMESTAMP DEFAULT NOW()
);
