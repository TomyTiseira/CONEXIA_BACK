-- Migration: Add requoting status and related columns
-- Date: 2025-10-29
-- Description: Adds requoting status for re-quotation flow and columns to track requote history

-- Add requoting status
INSERT INTO service_hiring_statuses (name, code, description) 
SELECT 'Re-cotizando', 'requoting', 'El cliente ha solicitado una actualización de la cotización vencida'
WHERE NOT EXISTS (
    SELECT 1 FROM service_hiring_statuses WHERE code = 'requoting'
);

-- Add columns for requote tracking
ALTER TABLE service_hirings 
ADD COLUMN IF NOT EXISTS requote_requested_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS previous_quoted_price DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS previous_quoted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS previous_quotation_validity_days INTEGER NULL,
ADD COLUMN IF NOT EXISTS requote_count INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN service_hirings.requote_requested_at IS 'Timestamp when the client requested a re-quotation';
COMMENT ON COLUMN service_hirings.previous_quoted_price IS 'Previous quoted price before re-quotation';
COMMENT ON COLUMN service_hirings.previous_quoted_at IS 'Previous quotation date before re-quotation';
COMMENT ON COLUMN service_hirings.previous_quotation_validity_days IS 'Previous quotation validity days before re-quotation';
COMMENT ON COLUMN service_hirings.requote_count IS 'Number of times a re-quotation has been requested';
