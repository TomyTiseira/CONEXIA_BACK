-- Migration: Add moderation-related states for service hirings
-- Date: 2026-01-07
-- Description: Adds new states for handling banned/suspended users

-- Add new states to service_hiring_statuses table
INSERT INTO service_hiring_statuses (name, code, description, is_active)
VALUES 
  ('Terminado por Moderación', 'terminated_by_moderation', 'Servicio terminado porque el proveedor fue baneado permanentemente', true),
  ('Finalizado por Moderación', 'finished_by_moderation', 'Servicio del proveedor baneado, ya no disponible', true)
ON CONFLICT (code) DO NOTHING;

-- Add moderation tracking columns to service_hirings table
ALTER TABLE service_hirings 
  ADD COLUMN IF NOT EXISTS terminated_by_moderation BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS terminated_reason TEXT,
  ADD COLUMN IF NOT EXISTS terminated_at TIMESTAMP;

-- Add moderation tracking columns to services table
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS hidden_by_moderation BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderation_updated_at TIMESTAMP;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_services_hidden_by_moderation ON services(hidden_by_moderation) WHERE hidden_by_moderation = TRUE;
CREATE INDEX IF NOT EXISTS idx_service_hirings_terminated ON service_hirings(terminated_by_moderation) WHERE terminated_by_moderation = TRUE;

-- Update existing 'active' services of banned users to be hidden (will be done via listener)
-- This is just the schema preparation
