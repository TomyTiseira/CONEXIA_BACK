-- Migración: Agregar nuevos tipos de compliance al enum
-- Fecha: 2026-01-26
-- Descripción: Agrega 7 nuevos valores al enum claim_compliances_compliance_type_enum
--              para permitir más opciones de resolución de reclamos

-- IMPORTANTE: Ejecutar este script en la base de datos services_db

-- Agregar work_completion (completar trabajo pendiente o faltante)
ALTER TYPE claim_compliances_compliance_type_enum 
ADD VALUE IF NOT EXISTS 'work_completion';

-- Agregar work_revision (revisar/corregir trabajo entregado)
ALTER TYPE claim_compliances_compliance_type_enum 
ADD VALUE IF NOT EXISTS 'work_revision';

-- Agregar apology_required (disculpa formal requerida)
ALTER TYPE claim_compliances_compliance_type_enum 
ADD VALUE IF NOT EXISTS 'apology_required';

-- Agregar service_discount (descuento en servicio futuro)
ALTER TYPE claim_compliances_compliance_type_enum 
ADD VALUE IF NOT EXISTS 'service_discount';

-- Agregar penalty_fee (penalización o multa)
ALTER TYPE claim_compliances_compliance_type_enum 
ADD VALUE IF NOT EXISTS 'penalty_fee';

-- Agregar account_restriction (restricción de cuenta temporal)
ALTER TYPE claim_compliances_compliance_type_enum 
ADD VALUE IF NOT EXISTS 'account_restriction';

-- Agregar other (otro tipo de cumplimiento personalizado)
ALTER TYPE claim_compliances_compliance_type_enum 
ADD VALUE IF NOT EXISTS 'other';

-- Verificar que todos los valores se agregaron correctamente
SELECT unnest(enum_range(NULL::claim_compliances_compliance_type_enum)) AS compliance_types;

-- Resultado esperado:
--  compliance_types
-- ----------------------
--  full_refund
--  partial_refund
--  full_redelivery
--  corrected_delivery
--  additional_delivery
--  payment_required
--  partial_payment
--  evidence_upload
--  confirmation_only
--  auto_refund
--  no_action_required
--  work_completion       <- NUEVO
--  work_revision         <- NUEVO
--  apology_required      <- NUEVO
--  service_discount      <- NUEVO
--  penalty_fee           <- NUEVO
--  account_restriction   <- NUEVO
--  other                 <- NUEVO
