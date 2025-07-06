-- Configurar autenticación para permitir conexiones desde otros contenedores
ALTER SYSTEM SET listen_addresses = '*';
ALTER SYSTEM SET max_connections = 100;

-- Recargar la configuración
SELECT pg_reload_conf(); 