-- ============================================================
-- Migración 002: Insertar catálogo de productos
-- Tablas: productos, producto_specs, producto_destacados
-- ============================================================

TRUNCATE TABLE producto_destacados, producto_specs, productos RESTART IDENTITY CASCADE;

-- ============================================================
-- PRODUCTOS
-- ============================================================
INSERT INTO productos (nombre, descripcion, precio, categoria, imagen, stock) VALUES
('Pastillero inteligente', 'Organiza tus medicinas con alertas diarias y recordatorios automáticos.', 29.82, 'Salud', '/img/PastilleroInteligente.png', 10),
('Pastillero', 'Organizador semanal con compartimentos para mañana, tarde y noche.', 24.00, 'Salud', '/img/Pastillero.png', 10),
('Botón SOS', 'Envía una alerta inmediata a tus contactos de emergencia con un solo toque.', 63.67, 'Seguridad', '/img/BotonSOS.png', 10),
('Temporizador', 'Recordatorios automáticos para no olvidar ninguna toma.', 24.00, 'Tecnología', '/img/Temporizador.png', 10),
('Robot asistente', 'Compañero del hogar con recordatorios, entretenimiento y funciones de seguridad.', 399.00, 'Tecnología', '/img/RobotAsistentee.png', 5),
('Tablet senior', 'Pantalla grande, fuente ampliada e interfaz simplificada para uso diario.', 243.99, 'Tecnología', '/img/Tablet Senior.png', 8),
('Tablet Bleta', 'Pantalla de 10.1" con interfaz simplificada y soporte remoto para familiares.', 299.99, 'Tecnología', 'https://bleta.io/wp-content/uploads/2022/11/Bleta_Funda-foto_1.jpg', 6),
('Tablet Lenovo', 'Lenovo Tab 10.1 (4GB 64GB) + Pen & Bumper', 299.99, 'Tecnología', 'https://p2-ofp.static.pub//fes/cms/2025/01/07/f1w7ihhya2qahhw51y0l1br26kafyp662303.png?width=400&height=400', 7),
('Tablet SPC', 'Tablet diseñada para facilitar el uso diario en personas mayores.', 299.99, 'Tecnología', '/img/TabletSPC.png', 9),
('Reloj GPS 4G', 'Monitoriza el ritmo cardíaco, oxígeno en sangre y detecta caídas.', 99.07, 'Tecnología', '/img/RelojGPS4G.png', 12),
('Reloj Watch Seniors', 'Monitoriza el ritmo cardíaco, oxígeno en sangre y detecta caídas.', 107.00, 'Tecnología', '/img/RelojWatchSeniors.png', 10),
('Reloj DescuentosMax', 'Monitoriza el ritmo cardíaco, oxígeno en sangre y detecta caídas.', 107.00, 'Tecnología', '/img/RelojDescuentosMax.png', 8),
('Reloj SAT25', 'Monitoriza el ritmo cardíaco, oxígeno en sangre y detecta caídas.', 109.99, 'Tecnología', '/img/RelojSAT25.png', 6),
('Reloj Tracmi', 'Monitoriza el ritmo cardíaco, oxígeno en sangre y detecta caídas.', 109.00, 'Tecnología', '/img/RelojTracmi.png', 7);

-- ============================================================
-- SPECS  (producto_id referencia el orden de inserción arriba)
-- ============================================================
INSERT INTO producto_specs (producto_id, etiqueta, valor) VALUES
-- 1 Pastillero inteligente
(1, 'Compartimentos', '28 (4 por día)'),
(1, 'Alertas', 'Sonido + luz LED'),
(1, 'Batería', 'USB recargable, 30 días'),
(1, 'Material', 'ABS sin BPA'),
(1, 'Dimensiones', '18 × 10 × 4 cm'),
-- 2 Pastillero
(2, 'Compartimentos', '21 (3 por día × 7 días)'),
(2, 'Colores', 'Mañana / Tarde / Noche'),
(2, 'Material', 'Plástico sin BPA'),
(2, 'Apertura', 'Fácil presión única'),
(2, 'Peso', '85 g'),
-- 3 Botón SOS
(3, 'Conectividad', '4G LTE + WiFi'),
(3, 'GPS', 'Tiempo real'),
(3, 'Batería', '500 mAh, 5 días standby'),
(3, 'Resistencia', 'IP67 (agua y polvo)'),
(3, 'Alcance', 'Sin límite (SIM incluida)'),
-- 4 Temporizador
(4, 'Alarmas', 'Hasta 8 programables'),
(4, 'Pantalla', 'LCD retroiluminada'),
(4, 'Batería', '2× AAA'),
(4, 'Volumen', 'Ajustable, 85 dB máx.'),
(4, 'Dimensiones', '7 × 5 × 2 cm'),
-- 5 Robot asistente
(5, 'Pantalla', '8" táctil HD'),
(5, 'Conectividad', 'WiFi + Bluetooth 5.0'),
(5, 'Cámara', '5 MP gran angular'),
(5, 'Altavoz', '2 × 5W estéreo'),
(5, 'Batería', '10.000 mAh, 8h uso'),
-- 6 Tablet senior
(6, 'Pantalla', '10.1" IPS 1280×800'),
(6, 'Procesador', 'Octa-core 1.8 GHz'),
(6, 'RAM / ROM', '4 GB / 64 GB'),
(6, 'Batería', '6.000 mAh'),
(6, 'Sistema', 'Android 12 simplificado'),
-- 7 Tablet Bleta
(7, 'Pantalla', '10.1" Full HD'),
(7, 'RAM / ROM', '4 GB / 64 GB'),
(7, 'Cámara', '8 MP trasera + 5 MP frontal'),
(7, 'Batería', '7.000 mAh'),
(7, 'Conectividad', 'WiFi + 4G opcional'),
-- 8 Tablet Lenovo
(8, 'Pantalla', '10.1" 1920×1200'),
(8, 'Procesador', 'MediaTek Helio G88'),
(8, 'RAM / ROM', '4 GB / 64 GB + microSD'),
(8, 'Batería', '7.700 mAh'),
(8, 'Extras', 'Lápiz táctil + funda Bumper'),
-- 9 Tablet SPC
(9, 'Pantalla', '10.1" IPS'),
(9, 'RAM / ROM', '3 GB / 32 GB'),
(9, 'Batería', '5.000 mAh'),
(9, 'Cámara', '5 MP + 2 MP frontal'),
(9, 'Sistema', 'Android Go Edition'),
-- 10 Reloj GPS 4G
(10, 'Conectividad', '4G + GPS + WiFi'),
(10, 'Sensores', 'FC, SpO2, acelerómetro'),
(10, 'Pantalla', '1.4" AMOLED'),
(10, 'Batería', '400 mAh, 3 días'),
(10, 'Resistencia', 'IP67'),
-- 11 Reloj Watch Seniors
(11, 'Conectividad', '4G LTE + GPS'),
(11, 'Pantalla', '1.6" táctil color'),
(11, 'Sensores', 'FC, SpO2, temperatura'),
(11, 'Batería', '600 mAh, 4 días'),
(11, 'Resistencia', 'IP68'),
-- 12 Reloj DescuentosMax
(12, 'Conectividad', '4G + Bluetooth'),
(12, 'Pantalla', '1.5" TFT color'),
(12, 'Batería', '450 mAh, 3-4 días'),
(12, 'Sensores', 'FC, SpO2'),
(12, 'Resistencia', 'IP67'),
-- 13 Reloj SAT25
(13, 'Conectividad', '4G + GPS + WiFi'),
(13, 'Pantalla', '1.69" IPS'),
(13, 'Batería', '700 mAh, 5 días'),
(13, 'Sensores', 'FC, SpO2, presión arterial'),
(13, 'Resistencia', 'IP68 sumergible'),
-- 14 Reloj Tracmi
(14, 'Conectividad', '4G + GPS dual'),
(14, 'Pantalla', '1.4" AMOLED redondo'),
(14, 'Batería', '500 mAh, 4 días'),
(14, 'Sensores', 'FC, SpO2, temperatura cutánea'),
(14, 'Resistencia', 'IP67');

-- ============================================================
-- DESTACADOS
-- ============================================================
INSERT INTO producto_destacados (producto_id, texto) VALUES
-- 1 Pastillero inteligente
(1, 'Alarma programable hasta 6 tomas'),
(1, 'Pantalla LCD con hora y fecha'),
(1, 'Tapa de seguridad con cierre'),
(1, 'Compatible con app móvil'),
-- 2 Pastillero
(2, 'Diseño extragrande fácil de abrir'),
(2, 'Letras y colores de gran tamaño'),
(2, 'Tapa sellada hermética'),
(2, 'Lavable en lavavajillas'),
-- 3 Botón SOS
(3, 'Alerta a 5 contactos simultáneos'),
(3, 'Localización GPS en tiempo real'),
(3, 'Llamada de voz bidireccional'),
(3, 'Geofencing con zonas seguras'),
(3, 'Detector de caídas automático'),
-- 4 Temporizador
(4, 'Botones extragrandes'),
(4, 'Alarma vibración + sonido'),
(4, 'Clip para bolsillo'),
(4, 'Visualización 24h / 12h'),
-- 5 Robot asistente
(5, 'Videollamadas con la familia'),
(5, 'Recordatorios de medicación'),
(5, 'Control por voz en español'),
(5, 'Sensor de caídas integrado'),
(5, 'Reproducción de música y vídeos'),
(5, 'Monitorización remota familiar'),
-- 6 Tablet senior
(6, 'Interfaz simplificada para mayores'),
(6, 'Fuente extragrande ajustable'),
(6, 'Modo asistido para familiares'),
(6, 'Soporte técnico remoto'),
(6, 'Funda protectora incluida'),
-- 7 Tablet Bleta
(7, 'App Bleta de control familiar'),
(7, 'Acceso remoto para hijos'),
(7, 'Interfaz ultra simplificada'),
(7, 'Videollamada con un toque'),
(7, 'Soporte 24/7 en español'),
-- 8 Tablet Lenovo
(8, 'Pantalla antirreflejos'),
(8, 'Lápiz digital preciso incluido'),
(8, 'Funda robusta antigolpes'),
(8, 'Google Kids Space compatible'),
(8, 'Actualizable a Android 13'),
-- 9 Tablet SPC
(9, 'Modo Senior preinstalado'),
(9, 'Iconos grandes y claros'),
(9, 'Marco antideslizante'),
(9, 'Soporte SPC en español'),
(9, 'Precio accesible'),
-- 10 Reloj GPS 4G
(10, 'Localización GPS en tiempo real'),
(10, 'Detector de caídas con alerta'),
(10, 'Llamadas de emergencia SOS'),
(10, 'Monitorización frecuencia cardíaca 24h'),
(10, 'Geofencing configurable'),
-- 11 Reloj Watch Seniors
(11, 'Botón SOS físico lateral'),
(11, 'Compatible iOS y Android'),
(11, 'Recordatorio de medicación'),
(11, 'Seguimiento de actividad'),
(11, 'Notificaciones de llamadas y mensajes'),
-- 12 Reloj DescuentosMax
(12, 'Precio muy competitivo'),
(12, 'Detección automática de caídas'),
(12, 'SOS con localización GPS'),
(12, 'Seguimiento del sueño'),
(12, 'App familiar en español'),
-- 13 Reloj SAT25
(13, 'Mayor autonomía de batería'),
(13, 'Medición de presión arterial'),
(13, 'Sumergible hasta 1.5 m'),
(13, 'Historial de salud en app'),
(13, 'Compatible con centro de atención SAT'),
-- 14 Reloj Tracmi
(14, 'GPS dual para mayor precisión'),
(14, 'Diseño circular elegante'),
(14, 'Alerta vibración + sonido'),
(14, 'Zona segura con geofencing'),
(14, 'Plataforma Tracmi con atención 24h');
