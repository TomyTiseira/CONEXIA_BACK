// Tipos de reclamo según quién lo hace
export enum ClaimType {
  // Cliente
  NOT_DELIVERED = 'not_delivered', // No se entregó el trabajo
  OFF_AGREEMENT = 'off_agreement', // Entrega fuera de lo acordado
  DEFECTIVE_DELIVERY = 'defective_delivery', // Entrega defectuosa
  CLIENT_OTHER = 'client_other', // Otro (cliente)

  // Proveedor
  PAYMENT_NOT_RECEIVED = 'payment_not_received', // No se recibió el pago
  PROVIDER_OTHER = 'provider_other', // Otro (proveedor)
}

// Estado del reclamo
export enum ClaimStatus {
  OPEN = 'open', // Recién creado, esperando revisión
  IN_REVIEW = 'in_review', // Moderador revisando
  PENDING_CLARIFICATION = 'pending_clarification', // Pendiente subsanación (esperando respuesta)
  REQUIRES_STAFF_RESPONSE = 'requires_staff_response', // Usuario ya subsanó, requiere acción del moderador/admin
  RESOLVED = 'resolved', // Resuelto favorablemente
  REJECTED = 'rejected', // Rechazado (reclamo infundado)
  CANCELLED = 'cancelled', // Cancelado por el denunciante (cierre sin resolución)
  FINISHED_BY_MODERATION = 'finished_by_moderation', // Cerrado por moderación (ej: una de las partes fue baneada)
}

// Tipo de resolución (determina el estado final del hiring)
export enum ClaimResolutionType {
  CLIENT_FAVOR = 'client_favor', // A favor del cliente → Cancelado por reclamo
  PROVIDER_FAVOR = 'provider_favor', // A favor del proveedor → Finalizado por reclamo
  PARTIAL_AGREEMENT = 'partial_agreement', // Acuerdo parcial → Finalizado con acuerdo
}

// Rol del reclamante
export enum ClaimRole {
  CLIENT = 'client', // El cliente hace el reclamo
  PROVIDER = 'provider', // El proveedor hace el reclamo
}

// Labels legibles para el frontend
export const ClaimTypeLabels: Record<ClaimType, string> = {
  [ClaimType.NOT_DELIVERED]: 'No se entregó el trabajo',
  [ClaimType.OFF_AGREEMENT]: 'Entrega fuera de lo acordado',
  [ClaimType.DEFECTIVE_DELIVERY]: 'Entrega defectuosa',
  [ClaimType.CLIENT_OTHER]: 'Otro (especificar)',
  [ClaimType.PAYMENT_NOT_RECEIVED]: 'No se recibió el pago',
  [ClaimType.PROVIDER_OTHER]: 'Otro (especificar)',
};

// Tipos disponibles por rol
export const ClaimTypesByRole: Record<ClaimRole, ClaimType[]> = {
  [ClaimRole.CLIENT]: [
    ClaimType.NOT_DELIVERED,
    ClaimType.OFF_AGREEMENT,
    ClaimType.DEFECTIVE_DELIVERY,
    ClaimType.CLIENT_OTHER,
  ],
  [ClaimRole.PROVIDER]: [
    ClaimType.PAYMENT_NOT_RECEIVED,
    ClaimType.PROVIDER_OTHER,
  ],
};
