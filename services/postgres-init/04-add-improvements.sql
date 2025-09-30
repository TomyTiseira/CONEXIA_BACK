-- Migration: Add improvements to services module
-- Date: 2025-09-30
-- Note: timeUnit column will be created by TypeORM synchronize, we just populate existing NULL values

-- Create ENUM type for time units if it doesn't exist (TypeORM will use this)
DO $$ BEGIN
    CREATE TYPE "services_timeunit_enum" AS ENUM ('hours', 'days', 'weeks');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update any existing NULL timeUnit values to default 'hours'
-- This will run after TypeORM creates the column
UPDATE services SET "timeUnit" = 'hours' WHERE "timeUnit" IS NULL;

-- Add quotationValidityDays column to service_hirings table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_hirings' AND column_name = 'quotationValidityDays') THEN
        ALTER TABLE service_hirings ADD COLUMN "quotationValidityDays" INTEGER NULL;
    END IF;
END $$;

-- Add expired status to service_hiring_statuses if it doesn't exist
INSERT INTO service_hiring_statuses (name, code, description) 
SELECT 'Vencida', 'expired', 'Cotización vencida por tiempo límite'
WHERE NOT EXISTS (
    SELECT 1 FROM service_hiring_statuses WHERE code = 'expired'
);

-- Additional safety update for any remaining NULL values (redundant but safe)
UPDATE services 
SET "timeUnit" = 'hours'::time_unit_enum
WHERE "timeUnit" IS NULL;