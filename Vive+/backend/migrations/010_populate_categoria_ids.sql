-- Migración 010: Poblar columnas _id desde los campos de texto existentes
-- Ejecutar UNA sola vez antes de desplegar el nuevo código

UPDATE actividades a
SET actividades_categoria_id = ca.id
FROM categorias_actividades ca
WHERE LOWER(TRIM(a.categoria)) = LOWER(TRIM(ca.nombre))
  AND a.actividades_categoria_id IS NULL;

UPDATE productos p
SET productos_categoria_id = cp.id
FROM categorias_productos cp
WHERE LOWER(TRIM(p.categoria)) = LOWER(TRIM(cp.nombre))
  AND p.productos_categoria_id IS NULL;

UPDATE organizaciones o
SET organizaciones_categoria_id = co.id
FROM categorias_organizaciones co
WHERE LOWER(TRIM(o.tipo)) = LOWER(TRIM(co.key))
  AND o.organizaciones_categoria_id IS NULL;

UPDATE medicos m
SET categorias_salud_id = cs.id
FROM categorias_salud cs
WHERE LOWER(TRIM(m.tipo)) = LOWER(TRIM(cs.nombre))
  AND m.categorias_salud_id IS NULL;

