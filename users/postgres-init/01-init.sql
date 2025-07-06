-- Configurar autenticación para permitir conexiones desde otros contenedores
ALTER SYSTEM SET listen_addresses = '*';
ALTER SYSTEM SET max_connections = 100;

-- Crear el usuario si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = current_setting('POSTGRES_USER')) THEN
        CREATE USER current_setting('POSTGRES_USER') WITH PASSWORD current_setting('POSTGRES_PASSWORD');
    END IF;
END
$$;

-- Dar permisos al usuario
GRANT ALL PRIVILEGES ON DATABASE current_setting('POSTGRES_DB') TO current_setting('POSTGRES_USER');
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO current_setting('POSTGRES_USER');
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO current_setting('POSTGRES_USER');
GRANT ALL PRIVILEGES ON SCHEMA public TO current_setting('POSTGRES_USER');

-- Configurar pg_hba.conf para permitir conexiones desde cualquier host
-- Esto se hace a través de variables de entorno en el docker-compose 