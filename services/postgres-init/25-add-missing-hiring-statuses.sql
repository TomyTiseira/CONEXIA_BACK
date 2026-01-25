-- Agregar estados faltantes para el sistema de contrataciones
-- Estos estados son necesarios para el flujo completo de servicios, reclamos y moderación

INSERT INTO service_hiring_statuses (code, name, description, created_at, updated_at)
VALUES 
  -- Estados del flujo de entrega y revisión
  ('delivered', 'Entregado', 'Servicio o entregable entregado, esperando revisión del cliente', NOW(), NOW()),
  ('revision_requested', 'Revisión Solicitada', 'Cliente solicitó cambios en una o más entregas del servicio', NOW(), NOW()),
  
  -- Estados del flujo de reclamos
  ('in_claim', 'En Reclamo', 'Servicio tiene un reclamo activo. Todas las acciones están suspendidas hasta que se resuelva', NOW(), NOW()),
  ('requoting', 'Re-cotizando', 'El cliente ha solicitado una actualización de la cotización vencida', NOW(), NOW()),
  
  -- Estados finales por resolución de reclamos
  ('cancelled_by_claim', 'Cancelado por reclamo', 'Contratación cancelada por reclamo resuelto a favor del cliente', NOW(), NOW()),
  ('completed_by_claim', 'Finalizado por reclamo', 'Contratación finalizada por reclamo resuelto a favor del proveedor', NOW(), NOW()),
  ('completed_with_agreement', 'Finalizado con acuerdo', 'Contratación finalizada con acuerdo parcial tras reclamo', NOW(), NOW()),
  
  -- Estados de moderación (baneo/suspensión de usuarios)
  ('terminated_by_moderation', 'Terminado por Moderación', 'Servicio terminado porque el proveedor o cliente fue baneado permanentemente', NOW(), NOW()),
  ('finished_by_moderation', 'Finalizado por Moderación', 'Servicio finalizado por decisión de moderación', NOW(), NOW())

ON CONFLICT (code) DO NOTHING;
