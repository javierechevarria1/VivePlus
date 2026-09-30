-- ============================================================
-- Migración 004: Añadir y rellenar campos faltantes en actividades
-- Ejecutar una sola vez en la base de datos PostgreSQL
-- ============================================================

-- 1. Añadir columnas si no existen
ALTER TABLE actividades ADD COLUMN IF NOT EXISTS duracion_min INT  DEFAULT NULL;
ALTER TABLE actividades ADD COLUMN IF NOT EXISTS url_lugar    TEXT DEFAULT NULL;

-- 2. creado_en: asignar DEFAULT NOW() y rellenar nulos
ALTER TABLE actividades ALTER COLUMN creado_en SET DEFAULT NOW();
UPDATE actividades SET creado_en = NOW() WHERE creado_en IS NULL;

-- 3. total_inscritos: sincronizar con las inscripciones reales
UPDATE actividades a
SET total_inscritos = (
  SELECT COUNT(*) FROM actividad_inscripciones i WHERE i.actividad_id = a.id
);

-- 4. url_mas_info: limpiar cadenas vacías
UPDATE actividades SET url_mas_info = NULL WHERE url_mas_info = '';

-- ============================================================
-- 5. url_lugar — Google Maps reales por actividad
-- ============================================================
UPDATE actividades SET url_lugar = 'https://www.google.com/maps/search/?api=1&query=Centro+C%C3%ADvico+Ca%C3%B1ad%C3%ADo+Santander'
  WHERE nombre = 'Taller de memoria y estimulación cognitiva';

UPDATE actividades SET url_lugar = 'https://www.google.com/maps/search/?api=1&query=Polideportivo+Municipal+Santander'
  WHERE nombre = 'Yoga suave para mayores';

UPDATE actividades SET url_lugar = 'https://www.google.com/maps/search/?api=1&query=Plaza+del+Ayuntamiento+Santander'
  WHERE nombre = 'Excursión a los valles pasiegos';

UPDATE actividades SET url_lugar = 'https://www.google.com/maps/search/?api=1&query=Casa+de+la+Cultura+Santander'
  WHERE nombre = 'Taller de iniciación a la pintura acuarela';

UPDATE actividades SET url_lugar = 'https://www.google.com/maps/search/?api=1&query=Biblioteca+Central+de+Cantabria+Santander'
  WHERE nombre = 'Charla: Nutrición saludable a partir de los 55';

UPDATE actividades SET url_lugar = 'https://www.google.com/maps/search/?api=1&query=Parroquia+San+Francisco+Santander'
  WHERE nombre = 'Baile de salón — nivel iniciación';

UPDATE actividades SET url_lugar = 'https://www.google.com/maps/search/?api=1&query=Biblioteca+Pe%C3%B1acastillo+Santander'
  WHERE nombre = 'Taller de smartphone e Internet seguro';

UPDATE actividades SET url_lugar = 'https://www.google.com/maps/search/?api=1&query=Faro+Cabo+Mayor+Santander'
  WHERE nombre = 'Senderismo por la costa: ruta del Faro Mayor';

UPDATE actividades SET url_lugar = 'https://www.google.com/maps/search/?api=1&query=Teatro+Coliseum+Santander'
  WHERE nombre = 'Tarde de cine y debate';

UPDATE actividades SET url_lugar = 'https://www.google.com/maps/search/?api=1&query=Jardines+de+Pereda+Santander'
  WHERE nombre = 'Taller de jardinería y huerto urbano';

UPDATE actividades SET url_lugar = 'https://www.google.com/maps/search/?api=1&query=Centro+de+Salud+Cisneros+Santander'
  WHERE nombre = 'Pilates terapéutico';

UPDATE actividades SET url_lugar = 'https://www.google.com/maps/search/?api=1&query=MAS+Museo+Arte+Moderno+Contemporaneo+Santander'
  WHERE nombre = 'Visita guiada al Museo de Arte Moderno y Contemporáneo';

-- Para actividades sin url_lugar todavía, generarla desde el campo lugar
UPDATE actividades
SET url_lugar = 'https://www.google.com/maps/search/?api=1&query=' || replace(lugar, ' ', '+')
WHERE (url_lugar IS NULL OR url_lugar = '')
  AND lugar IS NOT NULL AND lugar <> '';

-- ============================================================
-- 6. url_mas_info — páginas institucionales reales de Santander
-- ============================================================
UPDATE actividades SET url_mas_info = 'https://www.santander.es/areas-tematicas/mayores'
  WHERE nombre = 'Taller de memoria y estimulación cognitiva';

UPDATE actividades SET url_mas_info = 'https://www.santander.es/areas-tematicas/deportes'
  WHERE nombre = 'Yoga suave para mayores';

UPDATE actividades SET url_mas_info = 'https://www.turismodecantabria.com/disfrutalo/rutas/lista-de-rutas/1'
  WHERE nombre = 'Excursión a los valles pasiegos';

UPDATE actividades SET url_mas_info = 'https://www.santander.es/areas-tematicas/cultura-y-educacion'
  WHERE nombre = 'Taller de iniciación a la pintura acuarela';

UPDATE actividades SET url_mas_info = 'https://www.cantabria.es/web/gobierno-de-cantabria/areas-de-actividad/salud'
  WHERE nombre = 'Charla: Nutrición saludable a partir de los 55';

UPDATE actividades SET url_mas_info = 'https://www.santander.es/areas-tematicas/mayores'
  WHERE nombre = 'Baile de salón — nivel iniciación';

UPDATE actividades SET url_mas_info = 'https://www.cantabria.es/web/gobierno-de-cantabria/areas-de-actividad/sociedad-de-la-informacion'
  WHERE nombre = 'Taller de smartphone e Internet seguro';

UPDATE actividades SET url_mas_info = 'https://www.turismodecantabria.com/disfrutalo/rutas/lista-de-rutas/1'
  WHERE nombre = 'Senderismo por la costa: ruta del Faro Mayor';

UPDATE actividades SET url_mas_info = 'https://www.santander.es/areas-tematicas/cultura-y-educacion'
  WHERE nombre = 'Tarde de cine y debate';

UPDATE actividades SET url_mas_info = 'https://www.santander.es/areas-tematicas/medio-ambiente/parques-y-jardines'
  WHERE nombre = 'Taller de jardinería y huerto urbano';

UPDATE actividades SET url_mas_info = 'https://www.santander.es/areas-tematicas/deportes'
  WHERE nombre = 'Pilates terapéutico';

UPDATE actividades SET url_mas_info = 'https://www.santander.es/areas-tematicas/cultura-y-educacion/museos/museo-de-arte-moderno-y-contemporaneo-de-santander-y-cantabria-mas'
  WHERE nombre = 'Visita guiada al Museo de Arte Moderno y Contemporáneo';

-- ============================================================
-- 7. duracion_min por actividad
-- ============================================================
UPDATE actividades SET duracion_min = 90  WHERE nombre = 'Taller de memoria y estimulación cognitiva'              AND duracion_min IS NULL;
UPDATE actividades SET duracion_min = 60  WHERE nombre = 'Yoga suave para mayores'                                 AND duracion_min IS NULL;
UPDATE actividades SET duracion_min = 480 WHERE nombre = 'Excursión a los valles pasiegos'                         AND duracion_min IS NULL;
UPDATE actividades SET duracion_min = 120 WHERE nombre = 'Taller de iniciación a la pintura acuarela'              AND duracion_min IS NULL;
UPDATE actividades SET duracion_min = 90  WHERE nombre = 'Charla: Nutrición saludable a partir de los 55'          AND duracion_min IS NULL;
UPDATE actividades SET duracion_min = 90  WHERE nombre = 'Baile de salón — nivel iniciación'                       AND duracion_min IS NULL;
UPDATE actividades SET duracion_min = 120 WHERE nombre = 'Taller de smartphone e Internet seguro'                  AND duracion_min IS NULL;
UPDATE actividades SET duracion_min = 240 WHERE nombre = 'Senderismo por la costa: ruta del Faro Mayor'            AND duracion_min IS NULL;
UPDATE actividades SET duracion_min = 150 WHERE nombre = 'Tarde de cine y debate'                                  AND duracion_min IS NULL;
UPDATE actividades SET duracion_min = 120 WHERE nombre = 'Taller de jardinería y huerto urbano'                    AND duracion_min IS NULL;
UPDATE actividades SET duracion_min = 60  WHERE nombre = 'Pilates terapéutico'                                     AND duracion_min IS NULL;
UPDATE actividades SET duracion_min = 90  WHERE nombre = 'Visita guiada al Museo de Arte Moderno y Contemporáneo'  AND duracion_min IS NULL;
