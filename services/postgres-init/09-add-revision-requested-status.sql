-- Migration: Add revision_requested status
-- Date: 2025-10-18
-- Description: Adds the 'revision_requested' status for service hirings when client requests changes

-- Add revision_requested status to service_hiring_statuses if it doesn't exist
INSERT INTO service_hiring_statuses (name, code, description) 
SELECT 'Revisión Solicitada', 'revision_requested', 'Cliente solicitó cambios en una o más entregas del servicio'
WHERE NOT EXISTS (
    SELECT 1 FROM service_hiring_statuses WHERE code = 'revision_requested'
);
