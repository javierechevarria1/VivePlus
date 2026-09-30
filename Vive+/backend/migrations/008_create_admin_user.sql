-- Migración 008: usuario administrador (rol 5)
INSERT INTO usuarios (email, username, password, rol)
VALUES (
  'admin@relatia55.com',
  'Admin',
  '$2b$10$IJklh/r.uvARO4JtVFQPD.BhCL5mdXct5JFvNXXLwLyNryONiscly',
  5
)
ON CONFLICT (email) DO NOTHING;
