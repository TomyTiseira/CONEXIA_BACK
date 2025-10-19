export enum ServiceHiringStatusCode {
  PENDING = 'pending',
  QUOTED = 'quoted',
  ACCEPTED = 'accepted',
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
  // Estados finales por resolución de reclamos
  CANCELLED_BY_CLAIM = 'cancelled_by_claim', // A favor del cliente
  COMPLETED_BY_CLAIM = 'completed_by_claim', // A favor del proveedor
  COMPLETED_WITH_AGREEMENT = 'completed_with_agreement', // Acuerdo parcial
}
