-- Migration: Add MercadoPago Plan IDs to plans table
-- Date: 2025-11-06
-- Description: Agregar campos para vincular planes con suscripciones de MercadoPago

-- Agregar columnas para IDs de planes de MercadoPago
ALTER TABLE plans 
  ADD COLUMN IF NOT EXISTS "mercadoPagoPlanIdMonthly" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "mercadoPagoPlanIdAnnual" VARCHAR(255);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_plans_mercadopago_monthly 
  ON plans("mercadoPagoPlanIdMonthly");
  
CREATE INDEX IF NOT EXISTS idx_plans_mercadopago_annual 
  ON plans("mercadoPagoPlanIdAnnual");

-- Comentarios en las columnas
COMMENT ON COLUMN plans."mercadoPagoPlanIdMonthly" IS 'ID del plan de suscripción mensual en MercadoPago (preapproval_plan)';
COMMENT ON COLUMN plans."mercadoPagoPlanIdAnnual" IS 'ID del plan de suscripción anual en MercadoPago (preapproval_plan)';

-- Verificar cambios
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'plans'
  AND column_name LIKE '%mercadoPago%'
ORDER BY ordinal_position;

COMMIT;
