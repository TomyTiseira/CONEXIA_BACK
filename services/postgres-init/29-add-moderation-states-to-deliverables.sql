-- Migración: Agregar estados de moderación a deliverables y delivery_submissions
-- Fecha: 2026-02-01
-- Propósito: Permitir cancelar deliverables cuando un usuario es baneado

-- 1. Agregar nuevo estado a deliverable_status enum
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'cancelled_by_moderation' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'deliverable_status')
    ) THEN
        ALTER TYPE deliverable_status ADD VALUE 'cancelled_by_moderation';
    END IF;
END $$;

-- 2. Agregar nuevo estado a delivery_status enum
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'cancelled_by_moderation' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'delivery_status')
    ) THEN
        ALTER TYPE delivery_status ADD VALUE 'cancelled_by_moderation';
    END IF;
END $$;

-- 3. Agregar columnas de auditoría a deliverables
ALTER TABLE deliverables 
ADD COLUMN IF NOT EXISTS moderation_reason VARCHAR(500),
ADD COLUMN IF NOT EXISTS cancelled_by_moderation_at TIMESTAMP;

-- 4. Agregar columnas de auditoría a delivery_submissions
ALTER TABLE delivery_submissions
ADD COLUMN IF NOT EXISTS moderation_reason VARCHAR(500),
ADD COLUMN IF NOT EXISTS cancelled_by_moderation_at TIMESTAMP;

-- 5. Crear índices para mejorar performance de queries de moderación
CREATE INDEX IF NOT EXISTS idx_deliverables_status_moderation 
ON deliverables(status) 
WHERE status = 'cancelled_by_moderation';

CREATE INDEX IF NOT EXISTS idx_delivery_submissions_status_moderation 
ON delivery_submissions(status) 
WHERE status = 'cancelled_by_moderation';

-- Comentarios para documentación
COMMENT ON COLUMN deliverables.moderation_reason IS 'Razón de cancelación por moderación (cuando status = cancelled_by_moderation)';
COMMENT ON COLUMN deliverables.cancelled_by_moderation_at IS 'Fecha y hora de cancelación por moderación';
COMMENT ON COLUMN delivery_submissions.moderation_reason IS 'Razón de cancelación por moderación (cuando status = cancelled_by_moderation)';
COMMENT ON COLUMN delivery_submissions.cancelled_by_moderation_at IS 'Fecha y hora de cancelación por moderación';
