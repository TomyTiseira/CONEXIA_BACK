-- Agregar campo owner_moderation_status a services
-- Este campo denormaliza el estado de moderación del owner para evitar consultas NATS en cada búsqueda
-- Fecha: 2026-01-12

-- Agregar columna
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS owner_moderation_status VARCHAR(20);

-- Crear índice para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_services_owner_moderation_status 
ON services(owner_moderation_status) 
WHERE owner_moderation_status IS NOT NULL;

-- Comentario para documentación
COMMENT ON COLUMN services.owner_moderation_status IS 'Estado de moderación del owner: NULL (activo), suspended, banned. Se actualiza cuando el owner es suspendido/baneado.';
