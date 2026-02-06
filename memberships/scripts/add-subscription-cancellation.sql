-- Migración para agregar funcionalidad de cancelación de suscripciones
-- Agregar nuevo estado al enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'pending_cancellation' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'subscriptions_status_enum'
        )
    ) THEN
        ALTER TYPE subscriptions_status_enum ADD VALUE 'pending_cancellation';
    END IF;
END$$;

-- Agregar columnas
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS cancellation_date TIMESTAMP NULL;

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_subscriptions_pending_cancellation 
ON subscriptions (status, end_date) 
WHERE status = 'pending_cancellation';
