-- Conectar a la base de datos users_db
\c users_db;

-- Crear extensiones necesarias si no existen
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Configurar la base de datos para el uso
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content; 

-- Índices para performance de recomendaciones (users, profiles, profile_skills)
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_skills_profile_id ON profile_skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_skills_skill_id ON profile_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_profile_skills_profile_id_skill_id ON profile_skills(profile_id, skill_id);