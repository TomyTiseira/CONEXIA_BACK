-- =====================================================
-- MIGRACIÓN: Renombrar peer_objection a peer_review_reason
-- Fecha: 2026-01-27
-- Descripción: Renombra la columna para mejor semántica
--              (sirve para comentarios de aprobación Y rechazo)
-- =====================================================

-- Verificar si la columna peer_objection existe y peer_review_reason no existe
DO $$
BEGIN
  -- Solo ejecutar si peer_objection existe y peer_review_reason no existe
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'claim_compliances' 
    AND column_name = 'peer_objection'
  ) AND NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'claim_compliances' 
    AND column_name = 'peer_review_reason'
  ) THEN
    -- Renombrar la columna
    ALTER TABLE claim_compliances 
    RENAME COLUMN peer_objection TO peer_review_reason;
    
    RAISE NOTICE 'Columna peer_objection renombrada a peer_review_reason exitosamente';
  ELSE
    RAISE NOTICE 'La migración ya fue aplicada o peer_review_reason ya existe';
  END IF;
END $$;

-- Actualizar el comentario de la columna para mejor documentación
COMMENT ON COLUMN claim_compliances.peer_review_reason IS 
'Comentario o razón del peer al pre-aprobar o pre-rechazar el cumplimiento. 
Sirve tanto para aprobación como para rechazo.';
