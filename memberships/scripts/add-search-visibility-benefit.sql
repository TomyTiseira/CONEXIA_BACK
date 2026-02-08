-- Script para agregar el benefit search_visibility a los planes existentes
-- Fecha: 2026-02-02

-- 1. Primero, asegurarse de que el benefit search_visibility existe en la tabla benefits
INSERT INTO benefits (key, name, description, type, options, active)
VALUES (
  'search_visibility',
  'Visibilidad en búsquedas',
  'Nivel de priorización en los resultados de búsqueda',
  'enum',
  '["estandar", "alta", "prioridad_maxima"]'::json,
  true
)
ON CONFLICT (key) DO NOTHING;

-- 2. Actualizar el plan FREE para tener search_visibility: "estandar"
UPDATE plans
SET benefits = COALESCE(benefits, '[]'::json) || '[{"key": "search_visibility", "value": "estandar"}]'::jsonb
WHERE name = 'Free'
AND NOT (benefits::jsonb @> '[{"key": "search_visibility"}]'::jsonb);

-- 3. Actualizar el plan BASIC para tener search_visibility: "alta"
UPDATE plans
SET benefits = COALESCE(benefits, '[]'::json) || '[{"key": "search_visibility", "value": "alta"}]'::jsonb
WHERE name = 'Basic'
AND NOT (benefits::jsonb @> '[{"key": "search_visibility"}]'::jsonb);

-- 4. Actualizar el plan PREMIUM para tener search_visibility: "prioridad_maxima"
UPDATE plans
SET benefits = COALESCE(benefits, '[]'::json) || '[{"key": "search_visibility", "value": "prioridad_maxima"}]'::jsonb
WHERE name = 'Premium'
AND NOT (benefits::jsonb @> '[{"key": "search_visibility"}]'::jsonb);

-- 5. Verificar los planes actualizados
SELECT 
  id, 
  name, 
  benefits
FROM plans
ORDER BY monthly_price ASC;
