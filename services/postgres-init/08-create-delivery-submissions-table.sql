-- Crear tabla de entregas (delivery submissions)
CREATE TABLE IF NOT EXISTS delivery_submissions (
    id SERIAL PRIMARY KEY,
    hiring_id INTEGER NOT NULL,
    deliverable_id INTEGER,
    delivery_type VARCHAR(20) NOT NULL DEFAULT 'full',
    content TEXT NOT NULL,
    attachment_path VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    delivered_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    approved_at TIMESTAMP,
    revision_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_delivery_hiring 
        FOREIGN KEY (hiring_id) 
        REFERENCES service_hirings(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_delivery_deliverable 
        FOREIGN KEY (deliverable_id) 
        REFERENCES deliverables(id) 
        ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT chk_delivery_type 
        CHECK (delivery_type IN ('full', 'deliverable')),
    
    CONSTRAINT chk_delivery_status 
        CHECK (status IN ('pending', 'delivered', 'approved', 'revision_requested'))
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_delivery_hiring ON delivery_submissions(hiring_id);
CREATE INDEX IF NOT EXISTS idx_delivery_deliverable ON delivery_submissions(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status ON delivery_submissions(status);
CREATE INDEX IF NOT EXISTS idx_delivery_created_at ON delivery_submissions(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_delivery_submission_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_delivery_submission_timestamp
    BEFORE UPDATE ON delivery_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_delivery_submission_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE delivery_submissions IS 'Tabla de entregas de servicios y entregables';
COMMENT ON COLUMN delivery_submissions.delivery_type IS 'Tipo de entrega: full (servicio completo) o deliverable (entregable parcial)';
COMMENT ON COLUMN delivery_submissions.status IS 'Estado: pending, delivered, approved, revision_requested';
COMMENT ON COLUMN delivery_submissions.content IS 'Descripción de la entrega o URL';
COMMENT ON COLUMN delivery_submissions.attachment_path IS 'Ruta del archivo adjunto (imagen, documento, etc)';
COMMENT ON COLUMN delivery_submissions.delivered_at IS 'Fecha cuando el prestador envía la entrega';
COMMENT ON COLUMN delivery_submissions.reviewed_at IS 'Fecha cuando el cliente revisa la entrega';
COMMENT ON COLUMN delivery_submissions.approved_at IS 'Fecha cuando el cliente aprueba definitivamente';
COMMENT ON COLUMN delivery_submissions.revision_notes IS 'Notas del cliente si solicita revisión';
