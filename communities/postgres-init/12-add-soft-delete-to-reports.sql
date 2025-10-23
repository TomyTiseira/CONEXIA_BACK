-- Agregar campos para soft-delete en tablas de reportes
-- Estos campos permiten marcar reportes como inactivos sin eliminarlos físicamente

-- Para publication_reports
ALTER TABLE IF EXISTS publication_reports
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_publication_reports_active ON publication_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_publication_reports_updated_at ON publication_reports(updated_at);

COMMENT ON COLUMN publication_reports.is_active IS 'Indica si el reporte está activo o fue marcado como inactivo (soft-delete)';
COMMENT ON COLUMN publication_reports.updated_at IS 'Fecha de última actualización del reporte';
