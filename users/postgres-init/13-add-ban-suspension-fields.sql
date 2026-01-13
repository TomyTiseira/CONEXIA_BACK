-- Agregar campos de baneo y suspensión a la tabla users
-- Fecha: 2026-01-07

-- Crear tipo enum para account_status
DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('active', 'suspended', 'banned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Agregar columnas de estado de cuenta
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS account_status account_status DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS suspension_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspension_days INTEGER,
  ADD COLUMN IF NOT EXISTS suspended_by INTEGER,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS banned_by INTEGER,
  ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status) WHERE account_status != 'active';
CREATE INDEX IF NOT EXISTS idx_users_suspension_expires ON users(suspension_expires_at) WHERE suspension_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_banned_at ON users(banned_at) WHERE banned_at IS NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN users.account_status IS 'Estado de la cuenta: active, suspended, banned';
COMMENT ON COLUMN users.suspended_at IS 'Fecha y hora en que fue suspendido';
COMMENT ON COLUMN users.suspension_expires_at IS 'Fecha de expiración de la suspensión';
COMMENT ON COLUMN users.suspension_reason IS 'Razón detallada de la suspensión';
COMMENT ON COLUMN users.suspension_days IS 'Duración en días de la suspensión (7, 15, 30)';
COMMENT ON COLUMN users.suspended_by IS 'ID del moderador que aplicó la suspensión';
COMMENT ON COLUMN users.banned_at IS 'Fecha y hora en que fue baneado';
COMMENT ON COLUMN users.banned_by IS 'ID del moderador que aplicó el baneo';
COMMENT ON COLUMN users.ban_reason IS 'Razón detallada del baneo';

-- Tabla de auditoría para acciones de moderación
CREATE TABLE IF NOT EXISTS moderation_actions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- banned, suspended, reactivated, released
  moderator_id INTEGER, -- NULL para acciones automáticas
  reason TEXT,
  analysis_id INTEGER REFERENCES reports_moderation_analysis(id),
  metadata JSONB, -- Detalles adicionales
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_moderation_actions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para tabla de auditoría
CREATE INDEX IF NOT EXISTS idx_moderation_actions_user_id ON moderation_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_type ON moderation_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created_at ON moderation_actions(created_at DESC);

COMMENT ON TABLE moderation_actions IS 'Auditoría de acciones de moderación (baneos, suspensiones, etc)';
