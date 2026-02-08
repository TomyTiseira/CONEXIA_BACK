-- Tabla para historial de submissions de compliances
-- Mantiene registro de cada intento de cumplimiento
CREATE TABLE IF NOT EXISTS claim_compliance_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compliance_id UUID NOT NULL REFERENCES claim_compliances(id) ON DELETE CASCADE,
  
  -- Número de intento (1, 2, 3...)
  attempt_number INT NOT NULL,
  
  -- Estado de esta submission específica
  status VARCHAR(50) NOT NULL, -- 'pending_review', 'approved', 'rejected', 'requires_adjustment'
  
  -- Evidencia y notas del usuario
  evidence_urls TEXT[],
  user_notes TEXT,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Revisión del moderador
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  moderator_decision VARCHAR(20), -- 'approve', 'reject', 'adjust'
  moderator_notes TEXT,
  rejection_reason TEXT,
  
  -- Peer review (opcional)
  peer_reviewed_by VARCHAR(255),
  peer_approved BOOLEAN,
  peer_review_reason TEXT,
  peer_reviewed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_compliance_submissions_compliance ON claim_compliance_submissions(compliance_id);
CREATE INDEX IF NOT EXISTS idx_compliance_submissions_attempt ON claim_compliance_submissions(compliance_id, attempt_number);
CREATE INDEX IF NOT EXISTS idx_compliance_submissions_status ON claim_compliance_submissions(status);

-- Constraint para evitar duplicados de attempt_number por compliance
CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_submissions_unique_attempt 
  ON claim_compliance_submissions(compliance_id, attempt_number);

COMMENT ON TABLE claim_compliance_submissions IS 'Historial de todas las submissions de evidencia para cada compliance. Permite tracking de múltiples intentos y auditoría completa.';
COMMENT ON COLUMN claim_compliance_submissions.attempt_number IS 'Número de intento (1, 2, 3...). Incrementa con cada rechazo.';
COMMENT ON COLUMN claim_compliance_submissions.status IS 'Estado de esta submission: pending_review, approved, rejected, requires_adjustment';
COMMENT ON COLUMN claim_compliance_submissions.moderator_decision IS 'Decisión del moderador: approve, reject, adjust';
