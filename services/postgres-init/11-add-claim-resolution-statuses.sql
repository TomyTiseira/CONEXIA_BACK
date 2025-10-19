-- Migration: Add claim resolution statuses
-- Date: 2025-10-19
-- Description: Adds three new status codes for service hirings resolved through claims

-- Add cancelled_by_claim status (a favor del cliente)
INSERT INTO service_hiring_statuses (name, code, description) 
SELECT 'Cancelado por reclamo', 'cancelled_by_claim', 'Contratación cancelada por reclamo resuelto a favor del cliente'
WHERE NOT EXISTS (
    SELECT 1 FROM service_hiring_statuses WHERE code = 'cancelled_by_claim'
);

-- Add completed_by_claim status (a favor del proveedor)
INSERT INTO service_hiring_statuses (name, code, description) 
SELECT 'Finalizado por reclamo', 'completed_by_claim', 'Contratación finalizada por reclamo resuelto a favor del proveedor'
WHERE NOT EXISTS (
    SELECT 1 FROM service_hiring_statuses WHERE code = 'completed_by_claim'
);

-- Add completed_with_agreement status (acuerdo parcial)
INSERT INTO service_hiring_statuses (name, code, description) 
SELECT 'Finalizado con acuerdo', 'completed_with_agreement', 'Contratación finalizada con acuerdo parcial tras reclamo'
WHERE NOT EXISTS (
    SELECT 1 FROM service_hiring_statuses WHERE code = 'completed_with_agreement'
);
