-- Crear tabla de reportes de comentarios
CREATE TABLE IF NOT EXISTS comment_reports (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL,
    reporter_id INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL,
    other_reason TEXT,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment
        FOREIGN KEY(comment_id)
        REFERENCES publication_comments(id)
        ON DELETE CASCADE,
    CONSTRAINT unique_comment_reporter
        UNIQUE(comment_id, reporter_id)
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_comment_reports_comment_id ON comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_reporter_id ON comment_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_is_active ON comment_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_comment_reports_created_at ON comment_reports(created_at DESC);

-- Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_comment_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_reports_updated_at ON comment_reports;
CREATE TRIGGER trigger_update_comment_reports_updated_at
    BEFORE UPDATE ON comment_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_reports_updated_at();
