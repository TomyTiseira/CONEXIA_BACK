-- Script para optimizar índices de las tablas de usuarios
-- Este script mejora significativamente el rendimiento de las consultas de recomendaciones

-- Índice para consultas de usuarios por ID (usando nombres correctos de columnas)
CREATE INDEX IF NOT EXISTS idx_users_id_active 
ON users (id) 
WHERE "deletedAt" IS NULL;

-- Índice para consultas de perfiles por usuario
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON profiles ("userId");

-- Índice para consultas de habilidades de perfil
CREATE INDEX IF NOT EXISTS idx_profile_skills_profile_id 
ON profile_skills ("profileId");

CREATE INDEX IF NOT EXISTS idx_profile_skills_skill_id 
ON profile_skills ("skillId");

-- Índice compuesto para consultas de perfiles con habilidades
CREATE INDEX IF NOT EXISTS idx_profiles_user_skills 
ON profiles ("userId", id);

-- Índice para consultas de habilidades por IDs
CREATE INDEX IF NOT EXISTS idx_skills_id 
ON skills (id);

-- Índice para consultas de habilidades por nombre (búsquedas)
CREATE INDEX IF NOT EXISTS idx_skills_name 
ON skills (name);

-- Configuraciones optimizadas de PostgreSQL para evitar problemas de memoria
ALTER SYSTEM SET work_mem = '64MB';
ALTER SYSTEM SET shared_buffers = '128MB';
ALTER SYSTEM SET effective_cache_size = '512MB';
ALTER SYSTEM SET random_page_cost = 1.1;

-- Aplicar configuraciones
SELECT pg_reload_conf();

-- Estadísticas de las tablas para optimizar el planificador de consultas
ANALYZE users;
ANALYZE profiles;
ANALYZE profile_skills;
ANALYZE skills;

-- Comentarios sobre los índices creados
COMMENT ON INDEX idx_users_id_active IS 'Optimiza consultas de usuarios activos por ID (usando deletedAt)';
COMMENT ON INDEX idx_profiles_user_id IS 'Optimiza consultas de perfiles por usuario (usando userId)';
COMMENT ON INDEX idx_profile_skills_profile_id IS 'Optimiza consultas de habilidades por perfil (usando profileId)';
COMMENT ON INDEX idx_profile_skills_skill_id IS 'Optimiza consultas de habilidades por skill ID (usando skillId)';
COMMENT ON INDEX idx_profiles_user_skills IS 'Optimiza consultas de perfiles con habilidades (usando userId)';
COMMENT ON INDEX idx_skills_id IS 'Optimiza consultas de habilidades por ID';
COMMENT ON INDEX idx_skills_name IS 'Optimiza búsquedas de habilidades por nombre';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Optimizaciones de usuarios aplicadas exitosamente';
    RAISE NOTICE 'Índices creados con nombres de columnas correctos (camelCase)';
    RAISE NOTICE 'Configuraciones de memoria aplicadas para evitar heap overflow';
END $$;
