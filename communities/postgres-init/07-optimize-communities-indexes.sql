-- Optimizaciones de índices para el servicio de communities
-- Aplicado: ${new Date().toISOString()}

-- Índice para consultas de conexiones por emisor (ya existe pero verificamos)
CREATE INDEX IF NOT EXISTS idx_connections_sender_v2 
ON connections (sender_id);

-- Índice para consultas de conexiones por receptor (ya existe pero verificamos)
CREATE INDEX IF NOT EXISTS idx_connections_receiver_v2 
ON connections (receiver_id);

-- Índice para consultas de publicaciones por usuario
CREATE INDEX IF NOT EXISTS idx_publications_user_id 
ON publications (user_id);

-- Índice para consultas de publicaciones por fecha
CREATE INDEX IF NOT EXISTS idx_publications_created_at 
ON publications (created_at);

-- Índice para consultas de publicaciones activas
CREATE INDEX IF NOT EXISTS idx_publications_active 
ON publications (is_active);

-- Índice para consultas de publicaciones por privacidad
CREATE INDEX IF NOT EXISTS idx_publications_privacy 
ON publications (privacy);

-- Índice para consultas de comentarios por publicación (ya existe por FK)
CREATE INDEX IF NOT EXISTS idx_publication_comments_publication_v2 
ON publication_comments (publication_id);

-- Índice para consultas de comentarios por usuario
CREATE INDEX IF NOT EXISTS idx_publication_comments_user_id 
ON publication_comments (user_id);

-- Índice para consultas de reacciones por publicación (ya existe por FK)
CREATE INDEX IF NOT EXISTS idx_publication_reactions_publication_v2 
ON publication_reactions (publication_id);

-- Índice para consultas de reacciones por usuario
CREATE INDEX IF NOT EXISTS idx_publication_reactions_user_id 
ON publication_reactions (user_id);

-- Configuraciones de memoria para evitar heap overflow
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Aplicar configuraciones
SELECT pg_reload_conf();

-- Actualizar estadísticas
ANALYZE connections;
ANALYZE publications;
ANALYZE publication_comments;
ANALYZE publication_reactions;
ANALYZE publication_reports;

-- Comentarios sobre los índices creados
COMMENT ON INDEX idx_publications_user_id IS 'Optimiza consultas de publicaciones por usuario';
COMMENT ON INDEX idx_publications_created_at IS 'Optimiza consultas de publicaciones por fecha';
COMMENT ON INDEX idx_publications_active IS 'Optimiza consultas de publicaciones activas';
COMMENT ON INDEX idx_publications_privacy IS 'Optimiza consultas de publicaciones por privacidad';
COMMENT ON INDEX idx_publication_comments_user_id IS 'Optimiza consultas de comentarios por usuario';
COMMENT ON INDEX idx_publication_reactions_user_id IS 'Optimiza consultas de reacciones por usuario';

DO $$
BEGIN
    RAISE NOTICE 'Optimizaciones de communities aplicadas exitosamente';
    RAISE NOTICE 'Índices creados con nombres de columnas correctos (snake_case)';
    RAISE NOTICE 'Configuraciones de memoria aplicadas para evitar heap overflow';
END $$;