-- Script para optimizar índices de la tabla connections
-- Este script mejora significativamente el rendimiento de las consultas de recomendaciones

-- Índice compuesto para consultas de conexiones por usuario y estado
CREATE INDEX IF NOT EXISTS idx_connections_user_status 
ON connections (sender_id, status) 
WHERE status = 'accepted';

CREATE INDEX IF NOT EXISTS idx_connections_receiver_status 
ON connections (receiver_id, status) 
WHERE status = 'accepted';

-- Índice compuesto para consultas de amigos en común
CREATE INDEX IF NOT EXISTS idx_connections_sender_receiver_status 
ON connections (sender_id, receiver_id, status) 
WHERE status = 'accepted';

-- Índice para consultas de estado de conexión entre dos usuarios específicos
CREATE INDEX IF NOT EXISTS idx_connections_user_pair_status 
ON connections (sender_id, receiver_id, status);

-- Índice para consultas de conexiones por ID de conexión
CREATE INDEX IF NOT EXISTS idx_connections_id_status 
ON connections (id, status) 
WHERE status = 'accepted';

-- Estadísticas de la tabla para optimizar el planificador de consultas
ANALYZE connections;

-- Comentarios sobre los índices creados
COMMENT ON INDEX idx_connections_user_status IS 'Optimiza consultas de conexiones por usuario emisor y estado aceptado';
COMMENT ON INDEX idx_connections_receiver_status IS 'Optimiza consultas de conexiones por usuario receptor y estado aceptado';
COMMENT ON INDEX idx_connections_sender_receiver_status IS 'Optimiza consultas de amigos en común y relaciones bidireccionales';
COMMENT ON INDEX idx_connections_user_pair_status IS 'Optimiza consultas de estado de conexión entre dos usuarios específicos';
COMMENT ON INDEX idx_connections_id_status IS 'Optimiza consultas por ID de conexión con estado aceptado';
