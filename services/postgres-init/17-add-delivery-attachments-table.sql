-- Crear tabla delivery_attachments para soportar múltiples archivos por entrega
CREATE TABLE IF NOT EXISTS delivery_attachments (
  id SERIAL PRIMARY KEY,
  delivery_id INTEGER NOT NULL REFERENCES delivery_submissions(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para consultas rápidas por delivery_id
CREATE INDEX IF NOT EXISTS idx_delivery_attachments_delivery_id ON delivery_attachments(delivery_id);

-- Crear índice para orden
CREATE INDEX IF NOT EXISTS idx_delivery_attachments_order ON delivery_attachments(delivery_id, order_index);

-- Agregar comentarios descriptivos
COMMENT ON TABLE delivery_attachments IS 'Almacena múltiples archivos adjuntos para cada entrega (delivery)';
COMMENT ON COLUMN delivery_attachments.delivery_id IS 'ID de la entrega a la que pertenece el archivo';
COMMENT ON COLUMN delivery_attachments.file_path IS 'Ruta relativa del archivo en el servidor';
COMMENT ON COLUMN delivery_attachments.file_url IS 'URL completa para acceder al archivo';
COMMENT ON COLUMN delivery_attachments.file_name IS 'Nombre original del archivo subido por el usuario';
COMMENT ON COLUMN delivery_attachments.file_size IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN delivery_attachments.mime_type IS 'Tipo MIME del archivo (image/png, application/pdf, etc.)';
COMMENT ON COLUMN delivery_attachments.order_index IS 'Orden de visualización del archivo en la lista';

-- Migrar datos existentes de delivery_submissions a delivery_attachments
-- Solo para entregas que tienen archivos adjuntos
INSERT INTO delivery_attachments (
  delivery_id, 
  file_path, 
  file_url, 
  file_name, 
  file_size, 
  order_index, 
  created_at
)
SELECT 
  id as delivery_id,
  attachment_path as file_path,
  attachment_path as file_url, -- Por ahora usamos el mismo path, luego se puede ajustar
  -- Extraer nombre de archivo del path (última parte después de /)
  SUBSTRING(attachment_path FROM '[^/]+$') as file_name,
  attachment_size as file_size,
  0 as order_index,
  created_at
FROM delivery_submissions
WHERE attachment_path IS NOT NULL 
  AND attachment_path != ''
  -- Evitar duplicados si la migración se ejecuta múltiples veces
  AND NOT EXISTS (
    SELECT 1 FROM delivery_attachments da 
    WHERE da.delivery_id = delivery_submissions.id
  );

-- IMPORTANTE: NO eliminamos las columnas antiguas por compatibilidad
-- Las columnas attachment_path, attachment_url, attachment_size se mantienen
-- por si el frontend antiguo aún las necesita durante la transición

COMMENT ON COLUMN delivery_submissions.attachment_path IS 'DEPRECATED: Usar tabla delivery_attachments. Se mantiene por compatibilidad';
COMMENT ON COLUMN delivery_submissions.attachment_size IS 'DEPRECATED: Usar tabla delivery_attachments. Se mantiene por compatibilidad';
