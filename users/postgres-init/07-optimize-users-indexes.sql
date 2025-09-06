-- Script para optimizar índices de las tablas de usuarios
-- Este script mejora significativamente el rendimiento de las consultas de recomendaciones

-- Índice para consultas de usuarios por ID
CREATE INDEX IF NOT EXISTS idx_users_id_active 
ON users (id) 
WHERE deleted_at IS NULL;

-- Índice para consultas de perfiles por usuario
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON profiles (user_id);

-- Índice para consultas de habilidades de perfil
CREATE INDEX IF NOT EXISTS idx_profile_skills_profile_id 
ON profile_skills (profile_id);

CREATE INDEX IF NOT EXISTS idx_profile_skills_skill_id 
ON profile_skills (skill_id);

-- Índice compuesto para consultas de perfiles con habilidades
CREATE INDEX IF NOT EXISTS idx_profiles_user_skills 
ON profiles (user_id, id);

-- Índice para consultas de habilidades por IDs
CREATE INDEX IF NOT EXISTS idx_skills_id 
ON skills (id);

-- Índice para consultas de habilidades por nombre (búsquedas)
CREATE INDEX IF NOT EXISTS idx_skills_name 
ON skills (name);

-- Estadísticas de las tablas para optimizar el planificador de consultas
ANALYZE users;
ANALYZE profiles;
ANALYZE profile_skills;
ANALYZE skills;

-- Comentarios sobre los índices creados
COMMENT ON INDEX idx_users_id_active IS 'Optimiza consultas de usuarios activos por ID';
COMMENT ON INDEX idx_profiles_user_id IS 'Optimiza consultas de perfiles por usuario';
COMMENT ON INDEX idx_profile_skills_profile_id IS 'Optimiza consultas de habilidades por perfil';
COMMENT ON INDEX idx_profile_skills_skill_id IS 'Optimiza consultas de habilidades por skill ID';
COMMENT ON INDEX idx_profiles_user_skills IS 'Optimiza consultas de perfiles con habilidades';
COMMENT ON INDEX idx_skills_id IS 'Optimiza consultas de habilidades por ID';
COMMENT ON INDEX idx_skills_name IS 'Optimiza búsquedas de habilidades por nombre';
