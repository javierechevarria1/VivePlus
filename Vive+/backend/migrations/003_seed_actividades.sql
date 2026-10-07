-- ============================================================
-- Migración 003: Seed de actividades iniciales
-- Ejecutar una sola vez en la base de datos PostgreSQL
-- ============================================================

INSERT INTO actividades (nombre, descripcion, categoria, fecha, lugar, plazas_max, duracion_min, url_lugar, url_mas_info, estado) VALUES

(
  'Taller de memoria y estimulación cognitiva',
  'Ejercicios prácticos de memoria, atención y razonamiento para mantener el cerebro activo. Conducido por neuropsicólogos especializados en mayores.',
  'Salud',
  '2026-05-05 10:00:00',
  'Centro Cívico Cañadío',
  20,
  90,
  'https://www.google.com/maps/search/?api=1&query=Centro+C%C3%ADvico+Ca%C3%B1ad%C3%ADo+Santander',
  'https://www.santander.es/areas-tematicas/mayores',
  'activa'
),

(
  'Yoga suave para mayores',
  'Sesión de yoga adaptada, con posturas accesibles para mejorar la flexibilidad, el equilibrio y reducir el estrés.',
  'Deporte',
  '2026-05-07 09:30:00',
  'Polideportivo Municipal de Santander',
  15,
  60,
  'https://www.google.com/maps/search/?api=1&query=Polideportivo+Municipal+Santander',
  'https://www.santander.es/areas-tematicas/deportes',
  'activa'
),

(
  'Excursión a los valles pasiegos',
  'Ruta en autocar por los valles pasiegos cántabros con guía local, parada gastronómica y paseo por el entorno natural.',
  'Ocio',
  '2026-05-10 08:00:00',
  'Plaza del Ayuntamiento, Santander',
  30,
  480,
  'https://www.google.com/maps/search/?api=1&query=Plaza+del+Ayuntamiento+Santander',
  'https://www.turismodecantabria.com/disfrutalo/rutas/lista-de-rutas/1',
  'activa'
),

(
  'Taller de iniciación a la pintura acuarela',
  'Aprende las técnicas básicas de la acuarela en un ambiente tranquilo y creativo. Materiales incluidos.',
  'Cultura',
  '2026-05-14 17:00:00',
  'Casa de la Cultura de Santander',
  12,
  120,
  'https://www.google.com/maps/search/?api=1&query=Casa+de+la+Cultura+Santander',
  'https://www.santander.es/areas-tematicas/cultura-y-educacion',
  'activa'
),

(
  'Charla: Nutrición saludable a partir de los 55',
  'Conferencia con dietista-nutricionista sobre alimentación equilibrada, suplementación y hábitos saludables en la madurez.',
  'Salud',
  '2026-05-16 11:00:00',
  'Biblioteca Central de Cantabria',
  40,
  90,
  'https://www.google.com/maps/search/?api=1&query=Biblioteca+Central+de+Cantabria+Santander',
  'https://www.cantabria.es/web/gobierno-de-cantabria/areas-de-actividad/salud',
  'activa'
),

(
  'Baile de salón — nivel iniciación',
  'Clases de vals, pasodoble y foxtrot para parejas y personas que asisten solas. Ritmo pausado y ambiente acogedor.',
  'Ocio',
  '2026-05-19 18:00:00',
  'Parroquia San Francisco, Santander',
  24,
  90,
  'https://www.google.com/maps/search/?api=1&query=Parroquia+San+Francisco+Santander',
  'https://www.santander.es/areas-tematicas/mayores',
  'activa'
),

(
  'Taller de smartphone e Internet seguro',
  'Aprende a usar el móvil con confianza: videollamadas, WhatsApp, banca online y cómo identificar fraudes digitales.',
  'Tecnología',
  '2026-05-21 10:30:00',
  'Biblioteca de Peñacastillo',
  16,
  120,
  'https://www.google.com/maps/search/?api=1&query=Biblioteca+Pe%C3%B1acastillo+Santander',
  'https://www.cantabria.es/web/gobierno-de-cantabria/areas-de-actividad/sociedad-de-la-informacion',
  'activa'
),

(
  'Senderismo por la costa: ruta del Faro Mayor',
  'Caminata de dificultad baja-media por el litoral cantábrico. Distancia aproximada: 7 km. Se recomienda calzado deportivo.',
  'Deporte',
  '2026-05-24 09:00:00',
  'Parking Cabo Mayor, Santander',
  25,
  240,
  'https://www.google.com/maps/search/?api=1&query=Faro+Cabo+Mayor+Santander',
  'https://www.turismodecantabria.com/disfrutalo/rutas/lista-de-rutas/1',
  'activa'
),

(
  'Tarde de cine y debate',
  'Proyección de una película clásica seguida de un coloquio guiado. Entrada gratuita. Sesión con subtítulos.',
  'Cultura',
  '2026-05-28 16:30:00',
  'Teatro Coliseum, Santander',
  50,
  150,
  'https://www.google.com/maps/search/?api=1&query=Teatro+Coliseum+Santander',
  'https://www.santander.es/areas-tematicas/cultura-y-educacion',
  'activa'
),

(
  'Taller de jardinería y huerto urbano',
  'Iniciación al huerto en maceta y jardín de balcón. Cada participante se lleva una planta de temporada a casa.',
  'Ocio',
  '2026-06-02 10:00:00',
  'Jardines de Pereda, Santander',
  18,
  120,
  'https://www.google.com/maps/search/?api=1&query=Jardines+de+Pereda+Santander',
  'https://www.santander.es/areas-tematicas/medio-ambiente/parques-y-jardines',
  'activa'
),

(
  'Pilates terapéutico',
  'Sesión de pilates con fisioterapeuta, centrada en la mejora postural y el alivio del dolor lumbar y cervical.',
  'Salud',
  '2026-06-04 10:00:00',
  'Centro de Salud Cisneros, Santander',
  14,
  60,
  'https://www.google.com/maps/search/?api=1&query=Centro+de+Salud+Cisneros+Santander',
  'https://www.santander.es/areas-tematicas/deportes',
  'activa'
),

(
  'Visita guiada al Museo de Arte Moderno y Contemporáneo',
  'Recorrido guiado por las salas permanentes del MAS con explicaciones accesibles y pausa para café incluida.',
  'Cultura',
  '2026-06-09 11:00:00',
  'MAS Santander',
  20,
  90,
  'https://www.google.com/maps/search/?api=1&query=MAS+Museo+Arte+Moderno+Contemporaneo+Santander',
  'https://www.santander.es/areas-tematicas/cultura-y-educacion/museos/museo-de-arte-moderno-y-contemporaneo-de-santander-y-cantabria-mas',
  'activa'
);
