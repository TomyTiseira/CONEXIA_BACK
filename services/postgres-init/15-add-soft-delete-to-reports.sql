-- Agregar campos para soft-delete en service_reports
ALTER TABLE IF EXISTS service_reports
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_service_reports_active ON service_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_service_reports_updated_at ON service_reports(updated_at);

COMMENT ON COLUMN service_reports.is_active IS 'Indica si el reporte está activo o fue marcado como inactivo (soft-delete)';
COMMENT ON COLUMN service_reports.updated_at IS 'Fecha de última actualización del reporte';
