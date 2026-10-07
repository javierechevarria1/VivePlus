-- ============================================================
-- Migración 032: retención del pago en las ventas de segunda mano
--
-- Hasta ahora el producto se BORRABA al cobrarse y el dinero se
-- transfería al vendedor en el acto. Con la retención el producto
-- tiene que seguir vivo hasta que el ciclo se cierre, así que pasa
-- a marcarse como vendido y la venta se registra en su propia tabla.
-- ============================================================

-- El estado sustituye al DELETE como forma de retirar el producto del
-- catálogo, y es además el nuevo candado de idempotencia del post-venta:
-- solo la primera llamada consigue pasar de 'disponible' a 'vendido'.
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'disponible';

CREATE INDEX IF NOT EXISTS idx_productos_segunda_mano_estado
  ON productos (segunda_mano, estado);

CREATE TABLE IF NOT EXISTS ventas_segunda_mano (
  id                SERIAL PRIMARY KEY,

  producto_id       INTEGER NOT NULL REFERENCES productos(id),
  orden_id          INTEGER REFERENCES orden(id),
  vendedor_id       INTEGER NOT NULL REFERENCES usuarios(id),
  comprador_id      INTEGER REFERENCES usuarios(id),

  -- Identificadores del cobro. charge_id es el que se le pasa al transfer
  -- como source_transaction al liberar, para que Stripe vincule el pago
  -- concreto con su liberación en vez de tirar del balance disponible.
  payment_intent    VARCHAR(255),
  charge_id         VARCHAR(255),
  transfer_group    VARCHAR(255),
  transfer_id       VARCHAR(255),

  -- Desglose de lo que pagó el comprador. El vendedor cobra
  -- importe_producto íntegro; envío y gestión se los queda la plataforma.
  importe_producto  NUMERIC(10,2) NOT NULL,
  importe_envio     NUMERIC(10,2) NOT NULL DEFAULT 0,
  importe_gestion   NUMERIC(10,2) NOT NULL DEFAULT 0,
  importe_total     NUMERIC(10,2) NOT NULL,

  -- pagado → enviado → entregado → liberado
  --   ↘ reembolsado (sin envío en plazo, incidencia)
  estado            VARCHAR(20) NOT NULL DEFAULT 'pagado',

  -- Tramo de tarifa con el que se cobró el envío. En la fase 1 siempre es
  -- el tramo por defecto; cuando el vendedor pueda elegirlo al publicar,
  -- este campo guarda lo que se cobró realmente en esta venta.
  tamano_paquete    VARCHAR(1) NOT NULL DEFAULT 'M',

  -- Datos del envío. Los rellena el vendedor en la fase A y el agregador
  -- de transporte en la fase B.
  transportista     VARCHAR(100),
  seguimiento       VARCHAR(255),
  direccion_envio   TEXT,

  -- Plazos. limite_envio corta la espera si el vendedor no envía;
  -- limite_confirmacion auto-confirma la recepción si el comprador calla.
  limite_envio          TIMESTAMPTZ,
  limite_confirmacion   TIMESTAMPTZ,
  enviado_en            TIMESTAMPTZ,
  entregado_en          TIMESTAMPTZ,
  liberado_en           TIMESTAMPTZ,
  reembolsado_en        TIMESTAMPTZ,

  motivo_incidencia TEXT,

  creado_en         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Un producto solo puede venderse una vez: si el webhook y el redirect de
-- éxito llegan a la vez, el segundo choca contra este índice en lugar de
-- crear una venta duplicada.
CREATE UNIQUE INDEX IF NOT EXISTS idx_ventas_sm_producto
  ON ventas_segunda_mano (producto_id);

CREATE INDEX IF NOT EXISTS idx_ventas_sm_vendedor ON ventas_segunda_mano (vendedor_id);
CREATE INDEX IF NOT EXISTS idx_ventas_sm_comprador ON ventas_segunda_mano (comprador_id);
CREATE INDEX IF NOT EXISTS idx_ventas_sm_estado ON ventas_segunda_mano (estado);

-- El cron de liberación busca por aquí: ventas entregadas cuyo plazo venció.
CREATE INDEX IF NOT EXISTS idx_ventas_sm_pendientes_liberar
  ON ventas_segunda_mano (estado, limite_confirmacion);

-- transferencias_pendientes se creó apuntando solo al producto; con la
-- retención el fallo de un transfer hay que poder atarlo a su venta.
ALTER TABLE transferencias_pendientes
  ADD COLUMN IF NOT EXISTS venta_id INTEGER REFERENCES ventas_segunda_mano(id);
