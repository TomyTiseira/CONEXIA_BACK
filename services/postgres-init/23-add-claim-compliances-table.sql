-- =====================================================
-- MIGRACIÓN: Sistema de Cumplimiento de Reclamos
-- Fecha: 2026-01-20
-- Descripción: Tabla para gestionar cumplimientos post-resolución
-- =====================================================

-- Crear tipos ENUM para ComplianceType
CREATE TYPE compliance_type AS ENUM (
  'full_refund',           -- Devolución completa
  'partial_refund',        -- Devolución parcial
  'full_redelivery',       -- Reentrega completa del trabajo
  'corrected_delivery',    -- Entrega corregida/ajustada
  'additional_delivery',   -- Entrega adicional (archivos faltantes)
  'payment_required',      -- Cliente debe pagar
  'partial_payment',       -- Pago parcial
  'evidence_upload',       -- Subir evidencias documentales
  'confirmation_only',     -- Solo confirmar/aceptar
  'auto_refund',           -- Reembolso automático (futuro)
  'no_action_required'     -- No requiere acción (cierre directo)
);

-- Crear tipos ENUM para ComplianceStatus
CREATE TYPE compliance_status AS ENUM (
  'pending',               -- Esperando que el usuario actúe
  'submitted',             -- Usuario subió evidencia
  'peer_approved',         -- Otra parte lo pre-aprobó
  'peer_objected',         -- Otra parte objetó
  'in_review',             -- Moderador revisando
  'requires_adjustment',   -- Falta algo menor
  'approved',              -- Moderador aprobó
  'rejected',              -- No cumple, rechazado
  'overdue',               -- Pasó el plazo
  'warning',               -- Segunda advertencia
  'escalated'              -- Escalado a admin
);

-- Crear tabla claim_compliances
CREATE TABLE IF NOT EXISTS claim_compliances (
  -- Identificación
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  
  -- Responsable
  responsible_user_id VARCHAR(255) NOT NULL,
  
  -- Tipo y estado
  compliance_type compliance_type NOT NULL,
  status compliance_status NOT NULL DEFAULT 'pending',
  
  -- Plazos
  deadline TIMESTAMP NOT NULL,
  extended_deadline TIMESTAMP,
  final_deadline TIMESTAMP,
  original_deadline_days INTEGER NOT NULL DEFAULT 7,
  
  -- Instrucciones del moderador
  moderator_instructions TEXT NOT NULL,
  
  -- Evidencia del usuario
  evidence_urls TEXT[], -- Array de URLs de archivos subidos
  user_notes TEXT,
  submitted_at TIMESTAMP,
  
  -- PEER VALIDATION (Validación por la otra parte)
  peer_reviewed_by VARCHAR(255),
  peer_approved BOOLEAN,
  peer_objection TEXT,
  peer_reviewed_at TIMESTAMP,
  peer_review_deadline_days INTEGER DEFAULT 3,
  
  -- Revisión del moderador
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  moderator_notes TEXT,
  rejection_reason TEXT,
  rejection_count INTEGER DEFAULT 0,
  
  -- Sistema de consecuencias
  warning_level INTEGER DEFAULT 0, -- 0, 1, 2, 3
  appealed BOOLEAN DEFAULT FALSE,
  appeal_id UUID,
  
  -- Dependencias (para compliances secuenciales)
  depends_on UUID REFERENCES claim_compliances(id),
  order_number INTEGER DEFAULT 1,
  requirement VARCHAR(20) DEFAULT 'sequential', -- 'sequential' o 'parallel'
  
  -- Montos (si aplica a pagos)
  amount DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'ARS',
  payment_link TEXT,
  
  -- Automatización
  auto_approved BOOLEAN DEFAULT FALSE,
  requires_files BOOLEAN DEFAULT TRUE,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT fk_claim FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
  CONSTRAINT fk_depends_on FOREIGN KEY (depends_on) REFERENCES claim_compliances(id) ON DELETE SET NULL
);

-- Agregar campos a la tabla claims existente
ALTER TABLE claims ADD COLUMN IF NOT EXISTS claimant_user_id VARCHAR(255);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS defendant_user_id VARCHAR(255);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS final_outcome TEXT;

-- Actualizar claimant_user_id y defendant_user_id basado en claim_role
UPDATE claims
SET 
  claimant_user_id = CASE 
    WHEN claim_role = 'client' THEN service_hiring.client_id
    WHEN claim_role = 'provider' THEN service_hiring.provider_id
    ELSE NULL
  END,
  defendant_user_id = CASE 
    WHEN claim_role = 'client' THEN service_hiring.provider_id
    WHEN claim_role = 'provider' THEN service_hiring.client_id
    ELSE NULL
  END
FROM service_hirings service_hiring
WHERE claims.service_hiring_id = service_hiring.id
  AND claims.claimant_user_id IS NULL;

-- Crear índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_compliances_claim_id ON claim_compliances(claim_id);
CREATE INDEX IF NOT EXISTS idx_compliances_responsible_user ON claim_compliances(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_compliances_status ON claim_compliances(status);
CREATE INDEX IF NOT EXISTS idx_compliances_deadline ON claim_compliances(deadline);
CREATE INDEX IF NOT EXISTS idx_compliances_warning_level ON claim_compliances(warning_level);
CREATE INDEX IF NOT EXISTS idx_compliances_depends_on ON claim_compliances(depends_on);
CREATE INDEX IF NOT EXISTS idx_claims_claimant ON claims(claimant_user_id);
CREATE INDEX IF NOT EXISTS idx_claims_defendant ON claims(defendant_user_id);
CREATE INDEX IF NOT EXISTS idx_claims_closed_at ON claims(closed_at);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_claim_compliances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_claim_compliances_updated_at
  BEFORE UPDATE ON claim_compliances
  FOR EACH ROW
  EXECUTE FUNCTION update_claim_compliances_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE claim_compliances IS 'Gestiona los cumplimientos requeridos después de resolver un reclamo';
COMMENT ON COLUMN claim_compliances.peer_approved IS 'Pre-aprobación de la otra parte (innovación key)';
COMMENT ON COLUMN claim_compliances.warning_level IS '0=OK, 1=overdue, 2=warning, 3=escalated';
COMMENT ON COLUMN claim_compliances.requirement IS 'sequential: uno después del otro, parallel: ambos al mismo tiempo';

-- Insertar ejemplo de documentación
COMMENT ON TYPE compliance_type IS 'Tipos de cumplimiento: full_refund, partial_refund, full_redelivery, corrected_delivery, additional_delivery, payment_required, partial_payment, evidence_upload, confirmation_only, auto_refund, no_action_required';
COMMENT ON TYPE compliance_status IS 'Estados: pending, submitted, peer_approved, peer_objected, in_review, requires_adjustment, approved, rejected, overdue, warning, escalated';

-- Permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON claim_compliances TO services_user;
GRANT USAGE ON SEQUENCE claim_compliances_id_seq TO services_user;

COMMENT ON MIGRATION IS 'Sistema completo de cumplimiento post-resolución con peer validation';
