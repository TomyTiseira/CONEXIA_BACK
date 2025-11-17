-- Migración: Agregar campo clarification_response a la tabla claims
-- Fecha: 2025-11-15
-- Propósito: Separar la descripción original del reclamo de la respuesta del usuario al subsanar observaciones

-- Agregar columna clarification_response
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS clarification_response TEXT NULL;

-- Comentario para documentar el campo
COMMENT ON COLUMN claims.clarification_response IS 'Respuesta del usuario al subsanar observaciones del moderador. No reemplaza la descripción original.';

-- Índice para búsquedas (opcional, si se necesita buscar por este campo)
-- CREATE INDEX IF NOT EXISTS idx_claims_has_clarification ON claims (clarification_response) WHERE clarification_response IS NOT NULL;

\echo 'Migración 19: Campo clarification_response agregado exitosamente';
