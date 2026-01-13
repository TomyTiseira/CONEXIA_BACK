-- Agregar campo ownerModerationStatus a la tabla publications
-- Para filtrar publicaciones de usuarios suspendidos o baneados

-- Agregar columna ownerModerationStatus
ALTER TABLE publications 
ADD COLUMN IF NOT EXISTS "ownerModerationStatus" VARCHAR(20) DEFAULT NULL;

-- Crear índice para mejorar performance en consultas
CREATE INDEX IF NOT EXISTS idx_publications_owner_moderation 
ON publications("ownerModerationStatus");

-- Comentario explicativo
COMMENT ON COLUMN publications."ownerModerationStatus" IS 
'Estado de moderación del owner: NULL (activo), suspended, banned. Se usa para filtrar contenido de usuarios moderados';
