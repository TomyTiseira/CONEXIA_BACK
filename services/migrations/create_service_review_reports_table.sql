-- Migración: Crear tabla service_review_reports
-- Fecha: 2025-10-27
-- Descripción: Tabla para almacenar reportes de reseñas de servicios

CREATE TABLE IF NOT EXISTS service_review_reports (
    id SERIAL PRIMARY KEY,
    service_review_id INTEGER NOT NULL,
    reporter_id INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL CHECK (reason IN (
        'Contenido ofensivo o inapropiado',
        'Servicio engañoso o fraudulento',
        'Información falsa',
        'Otro'
    )),
    other_reason TEXT,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key a service_reviews
    CONSTRAINT fk_service_review
        FOREIGN KEY (service_review_id)
        REFERENCES service_reviews(id)
        ON DELETE CASCADE,
    
    -- Índice para buscar reportes por reseña
    CONSTRAINT idx_service_review_reporter
        UNIQUE (service_review_id, reporter_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_service_review_reports_review_id 
    ON service_review_reports(service_review_id);

CREATE INDEX IF NOT EXISTS idx_service_review_reports_reporter_id 
    ON service_review_reports(reporter_id);

CREATE INDEX IF NOT EXISTS idx_service_review_reports_created_at 
    ON service_review_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_review_reports_is_active 
    ON service_review_reports(is_active);

-- Comentarios en la tabla
COMMENT ON TABLE service_review_reports IS 'Reportes de reseñas de servicios realizados por dueños de servicios';
COMMENT ON COLUMN service_review_reports.service_review_id IS 'ID de la reseña reportada';
COMMENT ON COLUMN service_review_reports.reporter_id IS 'ID del usuario que reporta (dueño del servicio)';
COMMENT ON COLUMN service_review_reports.reason IS 'Motivo del reporte';
COMMENT ON COLUMN service_review_reports.other_reason IS 'Descripción del motivo cuando se selecciona "Otro" (máx 30 caracteres)';
COMMENT ON COLUMN service_review_reports.description IS 'Descripción detallada del reporte (máx 500 caracteres)';
COMMENT ON COLUMN service_review_reports.is_active IS 'Indica si el reporte está activo';
