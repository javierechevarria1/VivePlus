-- Servicios (catálogo)
INSERT INTO servicios (nombre, descripcion) VALUES
  ('Teleasistencia',         'Servicio de alarma y atención telefónica las 24 horas para situaciones de emergencia en el domicilio.'),
  ('Atención domiciliaria',  'Apoyo profesional en el hogar para las actividades de la vida diaria: higiene, alimentación y compañía.'),
  ('Transporte adaptado',    'Servicio de transporte accesible para acudir a centros médicos, actividades y gestiones personales.'),
  ('Apoyo social',           'Intervención de trabajadores sociales para orientación, gestión de recursos y acompañamiento.'),
  ('Acompañamiento',         'Compañía presencial o telefónica para reducir el aislamiento y mejorar el bienestar emocional.'),
  ('Talleres de memoria',    'Sesiones grupales con ejercicios cognitivos para estimular y mantener la memoria.'),
  ('Formación a cuidadores', 'Cursos y talleres para familiares y cuidadores profesionales sobre atención a personas dependientes.'),
  ('Envejecimiento activo',  'Programas de actividad física, cultural y social orientados a mantener la autonomía con la edad.'),
  ('Formación digital',      'Clases prácticas para mayores sobre uso de smartphones, internet y servicios digitales.'),
  ('Atención geriátrica',    'Valoración y seguimiento médico especializado en las patologías y necesidades propias de la vejez.'),
  ('Rehabilitación',         'Fisioterapia y terapia ocupacional para recuperar o mantener la funcionalidad física.'),
  ('Centros de día',         'Atención diurna en centro especializado con actividades terapéuticas, comedor y transporte.'),
  ('Residencias',            'Alojamiento permanente con atención integral para personas que no pueden vivir de forma autónoma.'),
  ('Grupos de apoyo',        'Reuniones periódicas de familias y afectados para compartir experiencias y recibir orientación.'),
  ('Asistencia personal',    'Apoyo individualizado para que la persona mayor pueda desenvolverse en su entorno cotidiano.'),
  ('Gestión del hogar',      'Servicio de limpieza, compras, cocina y mantenimiento del domicilio del usuario.'),
  ('Dispositivos de alarma', 'Instalación y seguimiento de pulsadores y sensores de emergencia en el domicilio.'),
  ('Talleres y manualidades','Actividades creativas grupales: pintura, cerámica, costura y otras manualidades.'),
  ('Viajes y excursiones',   'Organización de viajes nacionales e internacionales y salidas culturales adaptadas a mayores.'),
  ('Gimnasio adaptado',      'Sala de ejercicio con equipamiento y monitores especializados en actividad física para mayores.')
ON CONFLICT DO NOTHING;

-- Organizaciones
INSERT INTO organizaciones (nombre, tipo, descripcion, web, email, telefono, direccion, ciudad, logo_url, estado) VALUES
  ('Cruz Roja Cantabria',
   'ong',
   'Organización humanitaria que ofrece servicios de atención domiciliaria, teleasistencia y apoyo social a personas mayores en toda la región de Cantabria.',
   'https://www.cruzroja.es',
   'cantabria@cruzroja.es',
   '942 22 22 22',
   'Calle Vargas 53',
   'Santander',
   null,
   'activa'),

  ('Cáritas Santander',
   'ong',
   'Entidad de acción social de la Iglesia Católica que atiende a personas en situación de vulnerabilidad, con programas específicos de acompañamiento a mayores.',
   'https://www.caritassantander.org',
   'info@caritassantander.org',
   '942 31 44 00',
   'Calle Gravina 4',
   'Santander',
   null,
   'activa'),

  ('AFAN Cantabria',
   'ong',
   'Asociación de familiares de personas con Alzheimer y otras demencias. Ofrece atención directa, grupos de apoyo y orientación a cuidadores en Cantabria.',
   'https://www.afancantabria.org',
   'afancantabria@afancantabria.org',
   '942 33 12 56',
   'Calle Alta 15',
   'Santander',
   null,
   'activa'),

  ('Fundación Obra Social Caja Cantabria',
   'fundacion',
   'Fundación comprometida con el bienestar social que financia y gestiona programas de envejecimiento activo, formación digital y cultura para mayores de 55 años.',
   'https://www.fundacionobrasocialcajacantabria.es',
   'fundacion@cajacantabria.es',
   '942 20 42 00',
   'Calle Marcelino Sanz de Sautuola 6',
   'Santander',
   null,
   'activa'),

  ('Fundación Geriatros',
   'fundacion',
   'Fundación especializada en la atención geriátrica integral, con residencias y centros de día que promueven la calidad de vida y la autonomía personal.',
   'https://www.geriatros.es',
   'info@geriatros.es',
   '942 27 00 00',
   'Avenida de los Castros 80',
   'Santander',
   null,
   'activa'),

  ('Ayuda a Domicilio Cantabria',
   'empresa',
   'Empresa de servicios de atención domiciliaria profesional: asistencia personal, acompañamiento, gestión del hogar y cuidados de salud en el propio domicilio.',
   null,
   'info@ayudadomiciliocantabria.es',
   '942 55 10 20',
   'Calle Castilla 8',
   'Santander',
   null,
   'activa'),

  ('Teleayuda Senior',
   'empresa',
   'Empresa tecnológica especializada en soluciones de teleasistencia y telealarma para personas mayores, con atención 24 horas y dispositivos de última generación.',
   null,
   'contacto@teleayudasenior.es',
   '900 100 200',
   'Calle Joaquín Costa 14',
   'Santander',
   null,
   'activa'),

  ('Senior Activo Santander',
   'empresa',
   'Centro de actividades y ocio para mayores de 55 años. Talleres, viajes, gimnasio adaptado y actividades culturales para fomentar el envejecimiento activo.',
   null,
   'hola@senioractivo.es',
   '942 88 33 11',
   'Calle General Dávila 102',
   'Santander',
   null,
   'activa')
ON CONFLICT DO NOTHING;

-- Relaciones organizaciones ↔ servicios
INSERT INTO organizaciones_servicios (organizacion_id, servicio_id)
SELECT o.id, s.id FROM organizaciones o, servicios s WHERE
  (o.nombre = 'Cruz Roja Cantabria'                    AND s.nombre IN ('Teleasistencia','Atención domiciliaria','Transporte adaptado','Apoyo social')) OR
  (o.nombre = 'Cáritas Santander'                      AND s.nombre IN ('Acompañamiento','Apoyo social','Formación a cuidadores')) OR
  (o.nombre = 'AFAN Cantabria'                         AND s.nombre IN ('Talleres de memoria','Grupos de apoyo','Formación a cuidadores','Apoyo social')) OR
  (o.nombre = 'Fundación Obra Social Caja Cantabria'   AND s.nombre IN ('Envejecimiento activo','Formación digital','Talleres y manualidades','Viajes y excursiones')) OR
  (o.nombre = 'Fundación Geriatros'                    AND s.nombre IN ('Atención geriátrica','Rehabilitación','Centros de día','Residencias')) OR
  (o.nombre = 'Ayuda a Domicilio Cantabria'            AND s.nombre IN ('Asistencia personal','Atención domiciliaria','Gestión del hogar')) OR
  (o.nombre = 'Teleayuda Senior'                       AND s.nombre IN ('Teleasistencia','Dispositivos de alarma','Apoyo social')) OR
  (o.nombre = 'Senior Activo Santander'                AND s.nombre IN ('Envejecimiento activo','Talleres y manualidades','Viajes y excursiones','Gimnasio adaptado'))
ON CONFLICT DO NOTHING;
