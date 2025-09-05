-- Crear tipo de enumeración para reacciones
CREATE TYPE reaction_type AS ENUM ('like', 'love', 'support', 'celebrate', 'insightful', 'fun');

-- Crear tabla para reacciones
CREATE TABLE IF NOT EXISTS publication_reactions (
  id SERIAL PRIMARY KEY,
  type reaction_type DEFAULT 'like',
  user_id INTEGER NOT NULL,
  publication_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  FOREIGN KEY (publication_id) REFERENCES publications(id) ON DELETE CASCADE,
  -- Restricción de unicidad: un usuario solo puede tener un tipo de reacción por publicación
  UNIQUE (user_id, publication_id, deleted_at)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_publication_reactions_publication_id ON publication_reactions(publication_id);
CREATE INDEX IF NOT EXISTS idx_publication_reactions_user_id ON publication_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_publication_reactions_type ON publication_reactions(type);

-- Trigger para actualizar updated_at en cada modificación
CREATE OR REPLACE FUNCTION update_publication_reactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_publication_reactions_updated_at
BEFORE UPDATE ON publication_reactions
FOR EACH ROW
EXECUTE FUNCTION update_publication_reactions_updated_at();
