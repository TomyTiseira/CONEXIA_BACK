-- =========================================
-- CONFIGURACIONES DE OPTIMIZACIÓN AUTOMÁTICA
-- Este archivo aplica configuraciones optimizadas para PostgreSQL
-- Se ejecuta automáticamente al crear el contenedor
-- =========================================

-- Configuraciones de memoria y performance
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET work_mem = '128MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET seq_page_cost = 1.0;
ALTER SYSTEM SET cpu_tuple_cost = 0.01;

-- Configuraciones para mejores joins y sorts
ALTER SYSTEM SET enable_hashjoin = on;
ALTER SYSTEM SET enable_mergejoin = on;
ALTER SYSTEM SET enable_nestloop = off;
ALTER SYSTEM SET enable_sort = on;

-- Configuraciones de estadísticas para mejor planning
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET constraint_exclusion = partition;

-- Log para debugging en desarrollo
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_statement = 'mod';

-- Configuraciones de checkpoint para mejor rendimiento
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';

-- Aplicar configuraciones
SELECT pg_reload_conf();

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Configuraciones de optimización aplicadas exitosamente';
END $$;
