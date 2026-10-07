-- ============================================================
-- Migración 002: Crear tabla productos e insertar catálogo
-- Ejecutar en la nueva base de datos PostgreSQL
-- ============================================================

CREATE TABLE IF NOT EXISTS productos (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio      NUMERIC(10,2),
  categoria   VARCHAR(50),
  imagen      TEXT,
  stock       INTEGER DEFAULT 0
);

TRUNCATE TABLE productos RESTART IDENTITY;

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
