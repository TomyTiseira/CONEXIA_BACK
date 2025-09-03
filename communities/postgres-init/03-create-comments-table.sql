-- Crear tabla para comentarios
CREATE TABLE IF NOT EXISTS publication_comments (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  publication_id INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  FOREIGN KEY (publication_id) REFERENCES publications(id) ON DELETE CASCADE
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_publication_comments_publication_id ON publication_comments(publication_id);
CREATE INDEX IF NOT EXISTS idx_publication_comments_user_id ON publication_comments(user_id);

-- Trigger para actualizar updated_at en cada modificación
CREATE OR REPLACE FUNCTION update_publication_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_publication_comments_updated_at
BEFORE UPDATE ON publication_comments
FOR EACH ROW
EXECUTE FUNCTION update_publication_comments_updated_at();
