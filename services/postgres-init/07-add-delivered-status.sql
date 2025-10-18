-- Migration: Add delivered status
-- Date: 2025-10-18
-- Description: Adds the 'delivered' status for service hirings when provider submits deliverables

-- Add delivered status to service_hiring_statuses if it doesn't exist
INSERT INTO service_hiring_statuses (name, code, description) 
SELECT 'Entregado', 'delivered', 'Servicio o entregable enviado por el prestador, pendiente de revisión del cliente'
WHERE NOT EXISTS (
    SELECT 1 FROM service_hiring_statuses WHERE code = 'delivered'
);
