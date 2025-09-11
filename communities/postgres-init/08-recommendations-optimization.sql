-- Script de optimización avanzada para recomendaciones de usuarios
-- Este script se ejecuta automáticamente cuando se inicia el contenedor de PostgreSQL
-- Aplicable de forma idempotente (se puede ejecutar múltiples veces sin problemas)

-- Configurar parámetros de sesión para optimización
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;

-- Crear índices optimizados para recomendaciones sin CONCURRENTLY (más compatible)
-- Solo crear si la tabla connections existe

-- Verificar si la tabla existe y crear índices
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'connections') THEN
        RAISE NOTICE 'Aplicando optimizaciones para recomendaciones de usuarios...';
        
        -- Índice compuesto para consultas de conexiones aceptadas por usuario
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_connections_user_status_optimized') THEN
            EXECUTE 'CREATE INDEX idx_connections_user_status_optimized ON connections (sender_id, receiver_id, status) WHERE status = ''accepted''';
            RAISE NOTICE 'Creado índice: idx_connections_user_status_optimized';
        END IF;

        -- Índice inverso para consultas bidireccionales
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_connections_receiver_sender_status_optimized') THEN
            EXECUTE 'CREATE INDEX idx_connections_receiver_sender_status_optimized ON connections (receiver_id, sender_id, status) WHERE status = ''accepted''';
            RAISE NOTICE 'Creado índice: idx_connections_receiver_sender_status_optimized';
        END IF;

        -- Índice para mejorar el rendimiento de UNION ALL en la consulta de amigos mutuos
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_connections_mutual_friends_sender') THEN
            EXECUTE 'CREATE INDEX idx_connections_mutual_friends_sender ON connections (receiver_id, sender_id) WHERE status = ''accepted''';
            RAISE NOTICE 'Creado índice: idx_connections_mutual_friends_sender';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_connections_mutual_friends_receiver') THEN
            EXECUTE 'CREATE INDEX idx_connections_mutual_friends_receiver ON connections (sender_id, receiver_id) WHERE status = ''accepted''';
            RAISE NOTICE 'Creado índice: idx_connections_mutual_friends_receiver';
        END IF;

        -- Actualizar estadísticas para el optimizador
        ANALYZE connections;
        RAISE NOTICE 'Estadísticas actualizadas para tabla connections';

        -- Crear vista materializada para acelerar consultas frecuentes de amigos
        IF NOT EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'user_friends_cache') THEN
            CREATE MATERIALIZED VIEW user_friends_cache AS
            SELECT 
              user_id,
              ARRAY_AGG(friend_id ORDER BY friend_id) as friend_ids,
              COUNT(*) as friend_count
            FROM (
              SELECT sender_id as user_id, receiver_id as friend_id
              FROM connections 
              WHERE status = 'accepted'
              UNION ALL
              SELECT receiver_id as user_id, sender_id as friend_id
              FROM connections 
              WHERE status = 'accepted'
            ) friends
            GROUP BY user_id;

            -- Índice en la vista materializada
            CREATE UNIQUE INDEX IF NOT EXISTS idx_user_friends_cache_user_id 
            ON user_friends_cache (user_id);
            
            RAISE NOTICE 'Creada vista materializada: user_friends_cache';
        END IF;

        -- Actualizar estadísticas de la vista materializada
        ANALYZE user_friends_cache;
        
        RAISE NOTICE 'Optimizaciones de recomendaciones aplicadas exitosamente';
    ELSE
        RAISE NOTICE 'Tabla connections no existe todavía, las optimizaciones se aplicarán en la próxima inicialización';
    END IF;
END
$$;

-- Crear función para refrescar el caché de amigos (opcional, para mantenimiento)
CREATE OR REPLACE FUNCTION refresh_user_friends_cache()
RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'user_friends_cache') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY user_friends_cache;
        RAISE NOTICE 'Vista materializada user_friends_cache actualizada';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Comentario final
SELECT 'Optimizaciones de recomendaciones completadas' as status;
