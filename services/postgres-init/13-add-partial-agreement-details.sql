-- Migration: Add partial_agreement_details column to claims table
-- Date: 2025-10-19
-- Description: Adds a column to store details of partial agreements when resolving claims

-- Add partial_agreement_details column (nullable, TEXT type)
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS partial_agreement_details TEXT NULL;

-- Add comment to document the column
COMMENT ON COLUMN claims.partial_agreement_details IS 'Detalles del acuerdo parcial cuando resolutionType es PARTIAL_AGREEMENT';

-- Verify the column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'claims' 
        AND column_name = 'partial_agreement_details'
    ) THEN
        RAISE NOTICE '✅ Column partial_agreement_details added successfully to claims table';
    ELSE
        RAISE EXCEPTION '❌ Failed to add column partial_agreement_details to claims table';
    END IF;
END $$;
