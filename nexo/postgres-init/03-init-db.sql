-- Conectar a la base de datos nexo_db
\c nexo_db;

-- Crear extensiones necesarias si no existen
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Instalar pgvector extension para embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Configurar la base de datos para el uso
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;

