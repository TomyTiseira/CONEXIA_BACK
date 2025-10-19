-- Migration: Add claim observations and resolution type columns
-- Date: 2025-10-19
-- Description: Adds columns for moderator observations and resolution types to claims table

-- Add observations columns (for PENDING_CLARIFICATION status)
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS observations TEXT NULL;

ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS observations_by INT NULL;

ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS observations_at TIMESTAMP NULL;

-- Add resolution_type column
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS resolution_type VARCHAR(50) NULL;

-- Add PENDING_CLARIFICATION to claim_status enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'pending_clarification' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'claim_status')
    ) THEN
        ALTER TYPE claim_status ADD VALUE 'pending_clarification';
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN claims.observations IS 'Observaciones del moderador cuando el reclamo necesita subsanación';
COMMENT ON COLUMN claims.observations_by IS 'ID del moderador que agregó las observaciones';
COMMENT ON COLUMN claims.observations_at IS 'Fecha y hora cuando se agregaron las observaciones';
COMMENT ON COLUMN claims.resolution_type IS 'Tipo de resolución: client_favor, provider_favor o partial_agreement';
