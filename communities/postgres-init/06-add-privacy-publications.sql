-- Script para agregar el campo de privacidad a la tabla publications
-- Se ejecuta automáticamente al inicializar el contenedor PostgreSQL

-- Crear el tipo enum si no existe
DO $$ BEGIN
    CREATE TYPE "publication_privacy_enum" AS ENUM ('public', 'onlyFriends');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Agregar la columna privacy con valor por defecto 'public'
ALTER TABLE publications 
ADD COLUMN IF NOT EXISTS privacy "publication_privacy_enum" DEFAULT 'public';

-- Actualizar registros existentes para asegurar que tengan el valor por defecto
UPDATE publications 
SET privacy = 'public' 
WHERE privacy IS NULL;

-- Hacer la columna NOT NULL después de actualizar todos los registros
ALTER TABLE publications 
ALTER COLUMN privacy SET NOT NULL;

-- Crear un índice para mejorar el rendimiento de consultas por privacidad
CREATE INDEX IF NOT EXISTS idx_publications_privacy ON publications(privacy);

-- Log de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Campo de privacidad agregado exitosamente a la tabla publications';
END $$;
