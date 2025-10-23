-- Agregar campos para soft-delete en reports (proyectos)
ALTER TABLE IF EXISTS reports
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_reports_active ON reports(is_active);
CREATE INDEX IF NOT EXISTS idx_reports_updated_at ON reports(updated_at);

COMMENT ON COLUMN reports.is_active IS 'Indica si el reporte está activo o fue marcado como inactivo (soft-delete)';
COMMENT ON COLUMN reports.updated_at IS 'Fecha de última actualización del reporte';
