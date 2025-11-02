-- Migration: Add payment_pending and payment_rejected statuses
-- Date: 2025-11-01
-- Description: Implements payment flow with intermediate states

-- Add payment_pending status
INSERT INTO service_hiring_statuses (name, code, description) 
SELECT 'Pago en Proceso', 'payment_pending', 'El cliente fue redirigido a MercadoPago y el pago está siendo procesado. Esperando confirmación del webhook.'
WHERE NOT EXISTS (
    SELECT 1 FROM service_hiring_statuses WHERE code = 'payment_pending'
);

-- Add payment_rejected status
INSERT INTO service_hiring_statuses (name, code, description) 
SELECT 'Pago Rechazado', 'payment_rejected', 'El pago fue rechazado o cancelado por MercadoPago. El cliente puede reintentar.'
WHERE NOT EXISTS (
    SELECT 1 FROM service_hiring_statuses WHERE code = 'payment_rejected'
);

-- Add payment tracking columns to service_hirings table
ALTER TABLE service_hirings ADD COLUMN IF NOT EXISTS preference_id VARCHAR(255);
ALTER TABLE service_hirings ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);
ALTER TABLE service_hirings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50);
ALTER TABLE service_hirings ADD COLUMN IF NOT EXISTS payment_status_detail VARCHAR(255);
ALTER TABLE service_hirings ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE service_hirings ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_hirings_preference_id ON service_hirings(preference_id);
CREATE INDEX IF NOT EXISTS idx_service_hirings_payment_id ON service_hirings(payment_id);
