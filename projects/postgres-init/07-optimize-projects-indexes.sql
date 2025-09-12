-- Script para optimizar índices de las tablas de proyectos
-- Este script mejora significativamente el rendimiento de las consultas de proyectos

-- Índice para consultas de proyectos por ID
CREATE INDEX IF NOT EXISTS idx_projects_id_active 
ON projects (id) 
WHERE "deletedAt" IS NULL;

-- Índice para consultas de proyectos por usuario
CREATE INDEX IF NOT EXISTS idx_projects_user_id 
ON projects (user_id);

-- Índice para consultas de habilidades de proyecto
CREATE INDEX IF NOT EXISTS idx_project_skills_project_id 
ON project_skills (project_id);

CREATE INDEX IF NOT EXISTS idx_project_skills_skill_id 
ON project_skills (skill_id);

-- Índice para consultas de postulaciones
CREATE INDEX IF NOT EXISTS idx_postulations_project_id 
ON postulations (project_id);

CREATE INDEX IF NOT EXISTS idx_postulations_user_id 
ON postulations (user_id);

-- Índice para consultas de proyectos por activo
CREATE INDEX IF NOT EXISTS idx_projects_active 
ON projects ("isActive");

-- Índice para consultas de proyectos por categoría (ya existe, pero verificamos)
CREATE INDEX IF NOT EXISTS idx_projects_category_v2 
ON projects ("categoryId");

-- Índice para consultas de habilidades por IDs
CREATE INDEX IF NOT EXISTS idx_skills_id_projects 
ON skills (id);

-- Configuraciones optimizadas de PostgreSQL para evitar problemas de memoria
ALTER SYSTEM SET work_mem = '64MB';
ALTER SYSTEM SET shared_buffers = '128MB';
ALTER SYSTEM SET effective_cache_size = '512MB';
ALTER SYSTEM SET random_page_cost = 1.1;

-- Aplicar configuraciones
SELECT pg_reload_conf();

-- Estadísticas de las tablas para optimizar el planificador de consultas
ANALYZE projects;
ANALYZE project_skills;
ANALYZE postulations;
ANALYZE skills;

-- Comentarios sobre los índices creados
COMMENT ON INDEX idx_projects_id_active IS 'Optimiza consultas de proyectos activos por ID';
COMMENT ON INDEX idx_projects_user_id IS 'Optimiza consultas de proyectos por usuario';
COMMENT ON INDEX idx_project_skills_project_id IS 'Optimiza consultas de habilidades por proyecto';
COMMENT ON INDEX idx_project_skills_skill_id IS 'Optimiza consultas de habilidades por skill ID';
COMMENT ON INDEX idx_postulations_project_id IS 'Optimiza consultas de postulaciones por proyecto';
COMMENT ON INDEX idx_postulations_user_id IS 'Optimiza consultas de postulaciones por usuario';
COMMENT ON INDEX idx_projects_status IS 'Optimiza consultas de proyectos por estado';
COMMENT ON INDEX idx_projects_category IS 'Optimiza consultas de proyectos por categoría';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Optimizaciones de proyectos aplicadas exitosamente';
    RAISE NOTICE 'Índices creados con nombres de columnas correctos (camelCase)';
    RAISE NOTICE 'Configuraciones de memoria aplicadas para evitar heap overflow';
END $$;