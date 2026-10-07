-- ============================================================
-- Migración 001: Agregar campos completos a tabla productos
-- Ejecutar una sola vez en la base de datos PostgreSQL
-- ============================================================

-- Paso 1: Agregar columnas si no existen
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS descripcion   TEXT,
  ADD COLUMN IF NOT EXISTS precio        NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS categoria     VARCHAR(50),
  ADD COLUMN IF NOT EXISTS imagen        TEXT,
  ADD COLUMN IF NOT EXISTS specs         JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS destacados    JSONB DEFAULT '[]'::jsonb;

-- Paso 2: Limpiar catálogo anterior e insertar datos completos
TRUNCATE TABLE productos RESTART IDENTITY;

-- Paso 3: Insertar catálogo completo
INSERT INTO productos (nombre, descripcion, precio, categoria, imagen, stock, specs, destacados) VALUES

(
  'Pastillero inteligente',
  'Organiza tus medicinas con alertas diarias y recordatorios automáticos.',
  29.82,
  'Salud',
  '/img/PastilleroInteligente.png',
  10,
  '[{"label":"Compartimentos","value":"28 (4 por día)"},{"label":"Alertas","value":"Sonido + luz LED"},{"label":"Batería","value":"USB recargable, 30 días"},{"label":"Material","value":"ABS sin BPA"},{"label":"Dimensiones","value":"18 × 10 × 4 cm"}]',
  '["Alarma programable hasta 6 tomas","Pantalla LCD con hora y fecha","Tapa de seguridad con cierre","Compatible con app móvil"]'
),

(
  'Pastillero',
  'Organizador semanal con compartimentos para mañana, tarde y noche.',
  24.00,
  'Salud',
  '/img/Pastillero.png',
  10,
  '[{"label":"Compartimentos","value":"21 (3 por día × 7 días)"},{"label":"Colores","value":"Mañana / Tarde / Noche"},{"label":"Material","value":"Plástico sin BPA"},{"label":"Apertura","value":"Fácil presión única"},{"label":"Peso","value":"85 g"}]',
  '["Diseño extragrande fácil de abrir","Letras y colores de gran tamaño","Tapa sellada hermética","Lavable en lavavajillas"]'
),

(
  'Botón SOS',
  'Envía una alerta inmediata a tus contactos de emergencia con un solo toque.',
  63.67,
  'Seguridad',
  '/img/BotonSOS.png',
  10,
  '[{"label":"Conectividad","value":"4G LTE + WiFi"},{"label":"GPS","value":"Tiempo real"},{"label":"Batería","value":"500 mAh, 5 días standby"},{"label":"Resistencia","value":"IP67 (agua y polvo)"},{"label":"Alcance","value":"Sin límite (SIM incluida)"}]',
  '["Alerta a 5 contactos simultáneos","Localización GPS en tiempo real","Llamada de voz bidireccional","Geofencing con zonas seguras","Detector de caídas automático"]'
),

(
  'Temporizador',
  'Recordatorios automáticos para no olvidar ninguna toma.',
  24.00,
  'Tecnología',
  '/img/Temporizador.png',
  10,
  '[{"label":"Alarmas","value":"Hasta 8 programables"},{"label":"Pantalla","value":"LCD retroiluminada"},{"label":"Batería","value":"2× AAA"},{"label":"Volumen","value":"Ajustable, 85 dB máx."},{"label":"Dimensiones","value":"7 × 5 × 2 cm"}]',
  '["Botones extragrandes","Alarma vibración + sonido","Clip para bolsillo","Visualización 24h / 12h"]'
),

(
  'Robot asistente',
  'Compañero del hogar con recordatorios, entretenimiento y funciones de seguridad.',
  399.00,
  'Tecnología',
  '/img/RobotAsistentee.png',
  5,
  '[{"label":"Pantalla","value":"8\" táctil HD"},{"label":"Conectividad","value":"WiFi + Bluetooth 5.0"},{"label":"Cámara","value":"5 MP gran angular"},{"label":"Altavoz","value":"2 × 5W estéreo"},{"label":"Batería","value":"10.000 mAh, 8h uso"}]',
  '["Videollamadas con la familia","Recordatorios de medicación","Control por voz en español","Sensor de caídas integrado","Reproducción de música y vídeos","Monitorización remota familiar"]'
),

(
  'Tablet senior',
  'Pantalla grande, fuente ampliada e interfaz simplificada para uso diario.',
  243.99,
  'Tecnología',
  '/img/Tablet Senior.png',
  8,
  '[{"label":"Pantalla","value":"10.1\" IPS 1280×800"},{"label":"Procesador","value":"Octa-core 1.8 GHz"},{"label":"RAM / ROM","value":"4 GB / 64 GB"},{"label":"Batería","value":"6.000 mAh"},{"label":"Sistema","value":"Android 12 simplificado"}]',
  '["Interfaz simplificada para mayores","Fuente extragrande ajustable","Modo asistido para familiares","Soporte técnico remoto","Funda protectora incluida"]'
),

(
  'Tablet Bleta',
  'Pantalla de 10.1\" con interfaz simplificada y soporte remoto para familiares.',
  299.99,
  'Tecnología',
  'https://bleta.io/wp-content/uploads/2022/11/Bleta_Funda-foto_1.jpg',
  6,
  '[{"label":"Pantalla","value":"10.1\" Full HD"},{"label":"RAM / ROM","value":"4 GB / 64 GB"},{"label":"Cámara","value":"8 MP trasera + 5 MP frontal"},{"label":"Batería","value":"7.000 mAh"},{"label":"Conectividad","value":"WiFi + 4G opcional"}]',
  '["App Bleta de control familiar","Acceso remoto para hijos","Interfaz ultra simplificada","Videollamada con un toque","Soporte 24/7 en español"]'
),

(
  'Tablet Lenovo',
  'Lenovo Tab 10.1 (4GB 64GB) + Pen & Bumper',
  299.99,
  'Tecnología',
  'https://p2-ofp.static.pub//fes/cms/2025/01/07/f1w7ihhya2qahhw51y0l1br26kafyp662303.png?width=400&height=400',
  7,
  '[{"label":"Pantalla","value":"10.1\" 1920×1200"},{"label":"Procesador","value":"MediaTek Helio G88"},{"label":"RAM / ROM","value":"4 GB / 64 GB + microSD"},{"label":"Batería","value":"7.700 mAh"},{"label":"Extras","value":"Lápiz táctil + funda Bumper"}]',
  '["Pantalla antirreflejos","Lápiz digital preciso incluido","Funda robusta antigolpes","Google Kids Space compatible","Actualizable a Android 13"]'
),

(
  'Tablet SPC',
  'Tablet diseñada para facilitar el uso diario en personas mayores.',
  299.99,
  'Tecnología',
  '/img/TabletSPC.png',
  9,
  '[{"label":"Pantalla","value":"10.1\" IPS"},{"label":"RAM / ROM","value":"3 GB / 32 GB"},{"label":"Batería","value":"5.000 mAh"},{"label":"Cámara","value":"5 MP + 2 MP frontal"},{"label":"Sistema","value":"Android Go Edition"}]',
  '["Modo Senior preinstalado","Iconos grandes y claros","Marco antideslizante","Soporte SPC en español","Precio accesible"]'
),

(
  'Reloj GPS 4G',
  'Monitoriza el ritmo cardíaco, oxígeno en sangre y detecta caídas.',
  99.07,
  'Tecnología',
  '/img/RelojGPS4G.png',
  12,
  '[{"label":"Conectividad","value":"4G + GPS + WiFi"},{"label":"Sensores","value":"FC, SpO2, acelerómetro"},{"label":"Pantalla","value":"1.4\" AMOLED"},{"label":"Batería","value":"400 mAh, 3 días"},{"label":"Resistencia","value":"IP67"}]',
  '["Localización GPS en tiempo real","Detector de caídas con alerta","Llamadas de emergencia SOS","Monitorización frecuencia cardíaca 24h","Geofencing configurable"]'
),

(
  'Reloj Watch Seniors',
  'Monitoriza el ritmo cardíaco, oxígeno en sangre y detecta caídas.',
  107.00,
  'Tecnología',
  '/img/RelojWatchSeniors.png',
  10,
  '[{"label":"Conectividad","value":"4G LTE + GPS"},{"label":"Pantalla","value":"1.6\" táctil color"},{"label":"Sensores","value":"FC, SpO2, temperatura"},{"label":"Batería","value":"600 mAh, 4 días"},{"label":"Resistencia","value":"IP68"}]',
  '["Botón SOS físico lateral","Compatible iOS y Android","Recordatorio de medicación","Seguimiento de actividad","Notificaciones de llamadas y mensajes"]'
),

(
  'Reloj DescuentosMax',
  'Monitoriza el ritmo cardíaco, oxígeno en sangre y detecta caídas.',
  107.00,
  'Tecnología',
  '/img/RelojDescuentosMax.png',
  8,
  '[{"label":"Conectividad","value":"4G + Bluetooth"},{"label":"Pantalla","value":"1.5\" TFT color"},{"label":"Batería","value":"450 mAh, 3-4 días"},{"label":"Sensores","value":"FC, SpO2"},{"label":"Resistencia","value":"IP67"}]',
  '["Precio muy competitivo","Detección automática de caídas","SOS con localización GPS","Seguimiento del sueño","App familiar en español"]'
),

(
  'Reloj SAT25',
  'Monitoriza el ritmo cardíaco, oxígeno en sangre y detecta caídas.',
  109.99,
  'Tecnología',
  '/img/RelojSAT25.png',
  6,
  '[{"label":"Conectividad","value":"4G + GPS + WiFi"},{"label":"Pantalla","value":"1.69\" IPS"},{"label":"Batería","value":"700 mAh, 5 días"},{"label":"Sensores","value":"FC, SpO2, presión arterial"},{"label":"Resistencia","value":"IP68 sumergible"}]',
  '["Mayor autonomía de batería","Medición de presión arterial","Sumergible hasta 1.5 m","Historial de salud en app","Compatible con centro de atención SAT"]'
),

(
  'Reloj Tracmi',
  'Monitoriza el ritmo cardíaco, oxígeno en sangre y detecta caídas.',
  109.00,
  'Tecnología',
  '/img/RelojTracmi.png',
  7,
  '[{"label":"Conectividad","value":"4G + GPS dual"},{"label":"Pantalla","value":"1.4\" AMOLED redondo"},{"label":"Batería","value":"500 mAh, 4 días"},{"label":"Sensores","value":"FC, SpO2, temperatura cutánea"},{"label":"Resistencia","value":"IP67"}]',
  '["GPS dual para mayor precisión","Diseño circular elegante","Alerta vibración + sonido","Zona segura con geofencing","Plataforma Tracmi con atención 24h"]'
);
