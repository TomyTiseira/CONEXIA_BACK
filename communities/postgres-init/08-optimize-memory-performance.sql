-- Script de optimización específica para problemas de memoria
-- Este script agrega índices y configuraciones para mejorar el rendimiento del endpoint de recomendaciones

-- ===============================
-- ÍNDICES ESPECÍFICOS PARA RECOMENDACIONES
-- ===============================

-- Índice parcial para conexiones aceptadas (solo las que necesitamos)
CREATE INDEX IF NOT EXISTS idx_connections_accepted_users 
ON connections (sender_id, receiver_id) 
WHERE status = 'accepted';

-- Índice para consultas rápidas de conteo de conexiones
CREATE INDEX IF NOT EXISTS idx_connections_count_user 
ON connections (sender_id) 
WHERE status = 'accepted';

CREATE INDEX IF NOT EXISTS idx_connections_count_receiver 
ON connections (receiver_id) 
WHERE status = 'accepted';

-- Índice para optimizar consultas de amigos mutuos
CREATE INDEX IF NOT EXISTS idx_connections_mutual_friends 
ON connections (status, sender_id, receiver_id) 
WHERE status = 'accepted';

-- ===============================
-- CONFIGURACIONES DE MEMORIA ESPECÍFICAS
-- ===============================

-- Reducir work_mem para consultas complejas (evitar out of memory)
ALTER SYSTEM SET work_mem = '64MB';

-- Configurar límites más estrictos para joins
ALTER SYSTEM SET join_collapse_limit = 8;
ALTER SYSTEM SET from_collapse_limit = 8;

-- Optimizar para consultas frecuentes pequeñas
ALTER SYSTEM SET random_page_cost = 1.0;

-- Configurar timeout para consultas problemáticas
ALTER SYSTEM SET statement_timeout = '30s';

-- ===============================
-- ESTADÍSTICAS PARA OPTIMIZACIÓN
-- ===============================

-- Actualizar estadísticas de la tabla connections
ANALYZE connections;

-- Aumentar estadísticas para columnas clave
ALTER TABLE connections ALTER COLUMN sender_id SET STATISTICS 1000;
ALTER TABLE connections ALTER COLUMN receiver_id SET STATISTICS 1000;
ALTER TABLE connections ALTER COLUMN status SET STATISTICS 1000;

-- ===============================
-- CONFIGURACIONES DE CACHE
-- ===============================

-- Optimizar cache para consultas repetitivas
ALTER SYSTEM SET effective_cache_size = '512MB';
ALTER SYSTEM SET shared_buffers = '128MB';

-- Aplicar todas las configuraciones
SELECT pg_reload_conf();

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Optimizaciones de memoria para recomendaciones aplicadas exitosamente';
    RAISE NOTICE 'work_mem reducido a 64MB para evitar problemas de memoria';
    RAISE NOTICE 'Índices específicos para conexiones creados';
END $$;