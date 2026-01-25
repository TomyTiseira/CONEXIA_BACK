-- Agregar estados faltantes para postulaciones
-- Estos estados son necesarios para el flujo de moderación de usuarios

INSERT INTO postulation_statuses (code, name, description, can_transition_to_others, can_be_modified, is_final, display_order, created_at, updated_at)
VALUES 
  -- Estados de moderación
  ('cancelled_by_moderation', 'Cancelada por Moderación', 'Postulación cancelada porque el usuario o el dueño del proyecto fue baneado', false, false, true, 7, NOW(), NOW()),
  ('cancelled_by_suspension', 'Cancelada por Suspensión', 'Postulación cancelada porque el usuario fue suspendido temporalmente', false, false, true, 8, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;
