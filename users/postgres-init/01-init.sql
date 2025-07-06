-- Crear la base de datos si no existe
SELECT 'CREATE DATABASE users_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'users_db')\gexec

-- Configurar autenticación para permitir conexiones desde otros contenedores
ALTER SYSTEM SET listen_addresses = '*';
ALTER SYSTEM SET max_connections = 100;

-- Recargar la configuración
SELECT pg_reload_conf(); 