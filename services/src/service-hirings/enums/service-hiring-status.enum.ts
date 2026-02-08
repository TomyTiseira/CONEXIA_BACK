export enum ServiceHiringStatusCode {
  PENDING = 'pending',
  QUOTED = 'quoted',
  ACCEPTED = 'accepted',
  PAYMENT_PENDING = 'payment_pending', // ✅ NUEVO: Cliente redirigido a MercadoPago, esperando confirmación
  PAYMENT_REJECTED = 'payment_rejected', // ✅ NUEVO: Pago rechazado/cancelado
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  APPROVED = 'approved',
  IN_PROGRESS = 'in_progress',
  DELIVERED = 'delivered',
  REVISION_REQUESTED = 'revision_requested',
  COMPLETED = 'completed',
  NEGOTIATING = 'negotiating',
  EXPIRED = 'expired',
  IN_CLAIM = 'in_claim',
  REQUOTING = 'requoting', // Re-cotización solicitada por cliente
  // Estados finales por resolución de reclamos
  CANCELLED_BY_CLAIM = 'cancelled_by_claim', // A favor del cliente
  COMPLETED_BY_CLAIM = 'completed_by_claim', // A favor del proveedor
  COMPLETED_WITH_AGREEMENT = 'completed_with_agreement', // Acuerdo parcial
  // Estados por moderación
  TERMINATED_BY_MODERATION = 'terminated_by_moderation', // Proveedor baneado
  FINISHED_BY_MODERATION = 'finished_by_moderation', // Servicio de proveedor baneado
}
