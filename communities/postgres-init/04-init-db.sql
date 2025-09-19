-- Conectar a la base de datos communities_db
\c communities_db;

-- Crear extensiones necesarias si no existen
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Configurar la base de datos para el uso
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content; 

-- Índices para performance de recomendaciones (connections)
CREATE INDEX IF NOT EXISTS idx_connections_sender_id_status ON connections(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_receiver_id_status ON connections(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);