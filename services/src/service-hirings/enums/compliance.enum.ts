/**
 * Tipos de cumplimiento que se pueden requerir después de resolver un reclamo
 */
export enum ComplianceType {
  // === COMPROMISOS MONETARIOS ===
  /** Devolución completa del pago */
  FULL_REFUND = 'full_refund',

  /** Devolución parcial proporcional */
  PARTIAL_REFUND = 'partial_refund',

  /** Cliente debe completar el pago */
  PAYMENT_REQUIRED = 'payment_required',

  /** Pago parcial acordado */
  PARTIAL_PAYMENT = 'partial_payment',

  // === COMPROMISOS DE TRABAJO ===
  /** Completar trabajo pendiente o faltante */
  WORK_COMPLETION = 'work_completion',

  /** Revisar/corregir trabajo entregado */
  WORK_REVISION = 'work_revision',

  /** Reentrega completa del trabajo desde cero */
  FULL_REDELIVERY = 'full_redelivery',

  /** Entrega corregida/ajustada (modificaciones menores) */
  CORRECTED_DELIVERY = 'corrected_delivery',

  /** Entrega adicional (archivos faltantes, extras) */
  ADDITIONAL_DELIVERY = 'additional_delivery',

  // === DOCUMENTACIÓN ===
  /** Subir evidencias documentales (comprobantes, screenshots) */
  EVIDENCE_UPLOAD = 'evidence_upload',

  // === FINALIZACIÓN ===
  /** Solo confirmar/aceptar (sin subir archivos) */
  CONFIRMATION_ONLY = 'confirmation_only',

  /** Otro tipo de cumplimiento personalizado */
  OTHER = 'other',
}

/**
 * Estados del cumplimiento
 */
export enum ComplianceStatus {
  /** Esperando que el usuario responsable actúe */
  PENDING = 'pending',

  /** Usuario subió evidencia, esperando revisión */
  SUBMITTED = 'submitted',

  /** La otra parte (peer) pre-aprobó la evidencia */
  PEER_APPROVED = 'peer_approved',

  /** La otra parte (peer) objetó la evidencia */
  PEER_OBJECTED = 'peer_objected',

  /** Moderador está revisando */
  IN_REVIEW = 'in_review',

  /** Requiere ajuste menor (no es rechazo completo) */
  REQUIRES_ADJUSTMENT = 'requires_adjustment',

  /** Moderador aprobó el cumplimiento ✅ */
  APPROVED = 'approved',

  /** Moderador rechazó el cumplimiento ❌ */
  REJECTED = 'rejected',

  /** Pasó el plazo sin cumplir (Nivel 1) */
  OVERDUE = 'overdue',

  /** Segunda advertencia (Nivel 2) - Usuario suspendido */
  WARNING = 'warning',

  /** Escalado a admin (Nivel 3) - Pre-ban */
  ESCALATED = 'escalated',

  /** Cerrado por moderación (ej: una de las partes fue baneada) */
  FINISHED_BY_MODERATION = 'finished_by_moderation',
}

/**
 * Tipo de requisito para múltiples compliances
 */
export enum ComplianceRequirement {
  /** Deben cumplirse en orden secuencial */
  SEQUENTIAL = 'sequential',

  /** Pueden cumplirse en paralelo */
  PARALLEL = 'parallel',
}
