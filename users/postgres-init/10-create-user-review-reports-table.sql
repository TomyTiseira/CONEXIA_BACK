-- Crear tipo enum para los motivos de reporte si no existe
DO $$ BEGIN
    CREATE TYPE user_review_report_reason_enum AS ENUM (
        'Spam',
        'Acoso',
        'Contenido ofensivo',
        'Información falsa',
        'Otro'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tabla para reportes de reseñas de usuario
CREATE TABLE IF NOT EXISTS user_review_reports (
    id SERIAL PRIMARY KEY,
    user_review_id INTEGER NOT NULL,
    reporter_id INTEGER NOT NULL,
    reason user_review_report_reason_enum NOT NULL,
    other_reason TEXT,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Clave foránea a la tabla user_reviews
    CONSTRAINT fk_user_review
        FOREIGN KEY (user_review_id)
        REFERENCES user_reviews(id)
        ON DELETE CASCADE,
    
    -- Restricción única: un usuario solo puede reportar una reseña una vez
    CONSTRAINT unique_user_review_reporter
        UNIQUE (user_review_id, reporter_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_review_reports_user_review_id 
    ON user_review_reports(user_review_id);

CREATE INDEX IF NOT EXISTS idx_user_review_reports_reporter_id 
    ON user_review_reports(reporter_id);

CREATE INDEX IF NOT EXISTS idx_user_review_reports_is_active 
    ON user_review_reports(is_active);

CREATE INDEX IF NOT EXISTS idx_user_review_reports_created_at 
    ON user_review_reports(created_at DESC);

-- Trigger para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_user_review_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_review_reports_updated_at
    BEFORE UPDATE ON user_review_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_user_review_reports_updated_at();

-- Comentarios para documentar la tabla
COMMENT ON TABLE user_review_reports IS 'Almacena los reportes de reseñas de usuario realizados por los dueños del perfil';
COMMENT ON COLUMN user_review_reports.id IS 'ID único del reporte';
COMMENT ON COLUMN user_review_reports.user_review_id IS 'ID de la reseña reportada';
COMMENT ON COLUMN user_review_reports.reporter_id IS 'ID del usuario que reporta (debe ser el dueño del perfil)';
COMMENT ON COLUMN user_review_reports.reason IS 'Motivo del reporte';
COMMENT ON COLUMN user_review_reports.other_reason IS 'Razón adicional cuando el motivo es "Otro"';
COMMENT ON COLUMN user_review_reports.description IS 'Descripción detallada del reporte';
COMMENT ON COLUMN user_review_reports.is_active IS 'Indica si el reporte está activo (soft delete)';
COMMENT ON COLUMN user_review_reports.created_at IS 'Fecha y hora de creación del reporte';
COMMENT ON COLUMN user_review_reports.updated_at IS 'Fecha y hora de última actualización del reporte';
