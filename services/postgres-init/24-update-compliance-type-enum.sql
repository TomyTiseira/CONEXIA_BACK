-- =====================================================
-- MIGRACIÓN: Actualizar enum compliance_type
-- Fecha: 2026-01-24
-- Descripción: Agrega nuevos valores al enum claim_compliances_compliance_type_enum
-- =====================================================

-- Agregar nuevos valores al enum existente
-- NOTA: TypeORM crea el enum con el prefijo claim_compliances_compliance_type_enum

-- Agregar work_completion
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'work_completion' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'claim_compliances_compliance_type_enum')) THEN
    ALTER TYPE claim_compliances_compliance_type_enum ADD VALUE 'work_completion';
  END IF;
END $$;

-- Agregar work_revision
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'work_revision' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'claim_compliances_compliance_type_enum')) THEN
    ALTER TYPE claim_compliances_compliance_type_enum ADD VALUE 'work_revision';
  END IF;
END $$;

-- Agregar apology_required
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'apology_required' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'claim_compliances_compliance_type_enum')) THEN
    ALTER TYPE claim_compliances_compliance_type_enum ADD VALUE 'apology_required';
  END IF;
END $$;

-- Agregar service_discount
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'service_discount' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'claim_compliances_compliance_type_enum')) THEN
    ALTER TYPE claim_compliances_compliance_type_enum ADD VALUE 'service_discount';
  END IF;
END $$;

-- Agregar penalty_fee
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'penalty_fee' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'claim_compliances_compliance_type_enum')) THEN
    ALTER TYPE claim_compliances_compliance_type_enum ADD VALUE 'penalty_fee';
  END IF;
END $$;

-- Agregar account_restriction
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'account_restriction' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'claim_compliances_compliance_type_enum')) THEN
    ALTER TYPE claim_compliances_compliance_type_enum ADD VALUE 'account_restriction';
  END IF;
END $$;

-- Agregar other
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'other' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'claim_compliances_compliance_type_enum')) THEN
    ALTER TYPE claim_compliances_compliance_type_enum ADD VALUE 'other';
  END IF;
END $$;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Enum claim_compliances_compliance_type_enum actualizado exitosamente';
END $$;
