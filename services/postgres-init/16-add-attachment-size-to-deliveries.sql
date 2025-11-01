-- Agregar campo attachment_size a delivery_submissions
ALTER TABLE IF EXISTS delivery_submissions
ADD COLUMN IF NOT EXISTS attachment_size BIGINT NULL;

COMMENT ON COLUMN delivery_submissions.attachment_size IS 'Tamaño del archivo adjunto en bytes';

-- Crear índice para optimizar consultas que filtren por archivos con tamaño
CREATE INDEX IF NOT EXISTS idx_delivery_submissions_attachment_size ON delivery_submissions(attachment_size) WHERE attachment_size IS NOT NULL;
