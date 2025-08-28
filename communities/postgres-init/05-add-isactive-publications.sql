-- Agregar columna is_active a la tabla publications si no existe
ALTER TABLE publications ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Actualizar publicaciones existentes para que is_active sea true si no están borradas
UPDATE publications SET is_active = true WHERE deleted_at IS NULL OR is_active IS NULL;

-- Opcional: para futuras instalaciones, agregar esto al script de creación de la tabla si tienes uno.
