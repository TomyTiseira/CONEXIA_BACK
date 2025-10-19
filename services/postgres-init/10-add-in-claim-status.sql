-- Migration: Add in_claim status
-- Date: 2025-10-19
-- Description: Adds the in_claim status for service hirings when a claim is active

-- Add in_claim status to service_hiring_statuses if it doesn't exist
INSERT INTO service_hiring_statuses (name, code, description) 
SELECT 'En Reclamo', 'in_claim', 'Servicio tiene un reclamo activo. Todas las acciones están suspendidas hasta que se resuelva'
WHERE NOT EXISTS (
    SELECT 1 FROM service_hiring_statuses WHERE code = 'in_claim'
);
