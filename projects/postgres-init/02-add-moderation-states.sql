-- Migration: Add moderation-related states for projects and postulations
-- Date: 2026-01-07
-- Description: Adds new states and fields for handling banned/suspended users

-- Add moderation tracking columns to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS suspended_by_moderation BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderation_updated_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS can_accept_postulations BOOLEAN DEFAULT TRUE;

-- Add new postulation states
INSERT INTO postulation_statuses (name, code, description, is_active, can_transition_to_others, can_be_modified, is_final, display_order)
VALUES 
  ('Cancelada por Moderación', 'cancelled_by_moderation', 'Postulación cancelada porque el usuario fue baneado', true, false, false, true, 100),
  ('Cancelada por Suspensión', 'cancelled_by_suspension', 'Postulación pendiente cancelada porque el usuario fue suspendido', true, false, false, true, 101)
ON CONFLICT (code) DO NOTHING;

-- Add moderation tracking columns to postulations table  
ALTER TABLE postulations
  ADD COLUMN IF NOT EXISTS cancelled_by_moderation BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS moderation_cancelled_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS moderation_cancel_reason TEXT;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_suspended_by_moderation ON projects(suspended_by_moderation) WHERE suspended_by_moderation = TRUE;
CREATE INDEX IF NOT EXISTS idx_postulations_cancelled_by_moderation ON postulations(cancelled_by_moderation) WHERE cancelled_by_moderation = TRUE;
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_postulations_user_id ON postulations(user_id);
