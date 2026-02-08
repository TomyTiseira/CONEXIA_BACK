import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ComplianceRequirement,
  ComplianceStatus,
  ComplianceType,
} from '../enums/compliance.enum';
import { Claim } from './claim.entity';
import { ComplianceSubmission } from './compliance-submission.entity';

/**
 * Entidad que representa un cumplimiento requerido después de resolver un reclamo.
 *
 * Puede haber múltiples compliances por reclamo:
 * - Secuenciales: Uno después del otro (dependsOn)
 * - Paralelos: Ambos al mismo tiempo (requirement = 'parallel')
 *
 * Incluye sistema de peer validation (pre-aprobación por la otra parte)
 * y consecuencias progresivas por incumplimiento.
 */
@Entity('claim_compliances')
export class ClaimCompliance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============ RELACIÓN CON CLAIM ============
  @Column({ name: 'claim_id', type: 'uuid' })
  claimId: string;

  @ManyToOne(() => Claim, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'claim_id' })
  claim: Claim;

  // ============ HISTORIAL DE SUBMISSIONS ============
  @OneToMany(() => ComplianceSubmission, (submission) => submission.compliance)
  submissions: ComplianceSubmission[];

  // ============ RESPONSABLE ============
  /**
   * ID del usuario que debe cumplir (puede ser claimantUserId o defendantUserId)
   */
  @Column({ name: 'responsible_user_id', type: 'varchar', length: 255 })
  responsibleUserId: string;

  // ============ TIPO Y ESTADO ============
  @Column({
    name: 'compliance_type',
    type: 'enum',
    enum: ComplianceType,
  })
  complianceType: ComplianceType;

  @Column({
    type: 'enum',
    enum: ComplianceStatus,
    default: ComplianceStatus.PENDING,
  })
  status: ComplianceStatus;

  // ============ PLAZOS ============
  /**
   * Fecha límite inicial
   */
  @Column({ type: 'timestamp' })
  deadline: Date;

  /**
   * Fecha límite extendida (después de vencer una vez)
   */
  @Column({ name: 'extended_deadline', type: 'timestamp', nullable: true })
  extendedDeadline: Date | null;

  /**
   * Fecha límite final (último chance antes del ban)
   */
  @Column({ name: 'final_deadline', type: 'timestamp', nullable: true })
  finalDeadline: Date | null;

  /**
   * Días originales del plazo (para calcular extensiones)
   */
  @Column({ name: 'original_deadline_days', type: 'int', default: 7 })
  originalDeadlineDays: number;

  // ============ INSTRUCCIONES DEL MODERADOR ============
  /**
   * Instrucciones específicas de qué debe hacer el usuario
   * Ejemplo: "Debes rehacer el logo agregando el nombre de la empresa en formato vectorial"
   */
  @Column({ name: 'moderator_instructions', type: 'text' })
  moderatorInstructions: string;

  // ============ EVIDENCIA DEL USUARIO ============
  /**
   * URLs de archivos subidos como evidencia del cumplimiento
   */
  @Column({ name: 'evidence_urls', type: 'simple-array', nullable: true })
  evidenceUrls: string[] | null;

  /**
   * Notas del usuario al subir la evidencia
   */
  @Column({ name: 'user_notes', type: 'text', nullable: true })
  userNotes: string | null;

  /**
   * Fecha en que se subió la evidencia
   */
  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date | null;

  // ============ PEER VALIDATION (INNOVACIÓN) ============
  /**
   * ID del usuario que hizo la revisión peer (la otra parte del reclamo)
   */
  @Column({
    name: 'peer_reviewed_by',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  peerReviewedBy: string | null;

  /**
   * Resultado de la revisión peer
   * true = aprobó, false = objetó, null = no opinó
   */
  @Column({ name: 'peer_approved', type: 'boolean', nullable: true })
  peerApproved: boolean | null;

  /**
   * Comentario o razón del peer al pre-aprobar o pre-rechazar
   * Sirve tanto para aprobación como para rechazo
   */
  @Column({ name: 'peer_review_reason', type: 'text', nullable: true })
  peerReviewReason: string | null;

  /**
   * Fecha de la revisión peer
   */
  @Column({ name: 'peer_reviewed_at', type: 'timestamp', nullable: true })
  peerReviewedAt: Date | null;

  /**
   * Días que tiene la otra parte para opinar
   */
  @Column({ name: 'peer_review_deadline_days', type: 'int', default: 3 })
  peerReviewDeadlineDays: number;

  // ============ REVISIÓN DEL MODERADOR ============
  /**
   * ID del moderador que revisó
   */
  @Column({ name: 'reviewed_by', type: 'varchar', length: 255, nullable: true })
  reviewedBy: string | null;

  /**
   * Fecha de revisión
   */
  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  /**
   * Notas del moderador
   */
  @Column({ name: 'moderator_notes', type: 'text', nullable: true })
  moderatorNotes: string | null;

  /**
   * Razón del rechazo
   */
  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  /**
   * Contador de rechazos (para tracking)
   */
  @Column({ name: 'rejection_count', type: 'int', default: 0 })
  rejectionCount: number;

  // ============ TRACKING DE INTENTOS ============
  /**
   * Intento actual (1, 2, 3...)
   */
  @Column({ name: 'current_attempt', type: 'int', default: 1 })
  currentAttempt: number;

  /**
   * Máximo de intentos permitidos
   */
  @Column({ name: 'max_attempts', type: 'int', default: 3 })
  maxAttempts: number;

  // ============ SISTEMA DE CONSECUENCIAS ============
  /**
   * Nivel de advertencia
   * 0 = OK, 1 = Primera advertencia (1 rechazo), 2 = Suspensión (2 rechazos), 3 = Ban (3 rechazos)
   */
  @Column({ name: 'warning_level', type: 'int', default: 0 })
  warningLevel: number;

  /**
   * Si tiene una advertencia activa
   */
  @Column({ name: 'has_active_warning', type: 'boolean', default: false })
  hasActiveWarning: boolean;

  /**
   * Fecha en que se envió la advertencia
   */
  @Column({ name: 'warning_sent_at', type: 'timestamp', nullable: true })
  warningSentAt: Date | null;

  /**
   * Si se disparó suspensión automática
   */
  @Column({ name: 'suspension_triggered', type: 'boolean', default: false })
  suspensionTriggered: boolean;

  /**
   * Si se disparó ban automático
   */
  @Column({ name: 'ban_triggered', type: 'boolean', default: false })
  banTriggered: boolean;

  /**
   * Si el usuario apeló antes del ban
   */
  @Column({ type: 'boolean', default: false })
  appealed: boolean;

  /**
   * ID de la apelación (tabla separada si se implementa)
   */
  @Column({ name: 'appeal_id', type: 'uuid', nullable: true })
  appealId: string | null;

  // ============ DEPENDENCIAS (COMPLIANCES SECUENCIALES) ============
  /**
   * ID del compliance del cual depende este
   * null = es el primero o es paralelo
   */
  @Column({ name: 'depends_on', type: 'uuid', nullable: true })
  dependsOn: string | null;

  /**
   * Orden de ejecución (1, 2, 3, ...)
   */
  @Column({ name: 'order_number', type: 'int', default: 1 })
  orderNumber: number;

  /**
   * Tipo de requisito
   * 'sequential' = uno después del otro
   * 'parallel' = pueden cumplirse al mismo tiempo
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: ComplianceRequirement.SEQUENTIAL,
  })
  requirement: ComplianceRequirement;

  // ============ MONTOS (SI APLICA A PAGOS) ============
  /**
   * Monto a pagar (si es PAYMENT_REQUIRED o PARTIAL_PAYMENT)
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number | null;

  /**
   * Moneda
   */
  @Column({ type: 'varchar', length: 10, default: 'ARS', nullable: true })
  currency: string | null;

  /**
   * Link de pago de MercadoPago
   */
  @Column({ name: 'payment_link', type: 'text', nullable: true })
  paymentLink: string | null;

  // ============ AUTOMATIZACIÓN ============
  /**
   * Si fue aprobado automáticamente (ej: pago verificado por webhook)
   */
  @Column({ name: 'auto_approved', type: 'boolean', default: false })
  autoApproved: boolean;

  /**
   * Si requiere subir archivos o solo confirmar
   */
  @Column({ name: 'requires_files', type: 'boolean', default: true })
  requiresFiles: boolean;

  // ============ AUDITORÍA ============
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ============ MÉTODOS HELPER ============

  /**
   * Calcula los días vencidos desde el deadline original
   * Retorna 0 si no está vencido
   */
  getDaysOverdue(): number {
    const now = new Date();
    if (now <= this.deadline) {
      return 0;
    }
    const diff = now.getTime() - this.deadline.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Calcula el estado de vencimiento actual
   * - NOT_OVERDUE: Dentro del plazo
   * - FIRST_WARNING: 0-2 días vencido (grace period de 3 días)
   * - SUSPENDED: 3-4 días vencido (suspensión + 2 días adicionales)
   * - BANNED: 5+ días vencido (baneo permanente)
   */
  getOverdueStatus(): string {
    const daysOverdue = this.getDaysOverdue();

    if (daysOverdue === 0) return 'NOT_OVERDUE';
    if (daysOverdue >= 1 && daysOverdue < 3) return 'FIRST_WARNING';
    if (daysOverdue >= 3 && daysOverdue < 5) return 'SUSPENDED';
    return 'BANNED';
  }

  /**
   * Verifica si aún puede subir evidencia
   * Permitido hasta 5 días después de vencido el plazo original
   */
  canStillSubmit(): boolean {
    // Si está aprobado o rechazado, no puede subir más
    if (this.isFinal()) {
      return false;
    }

    const daysOverdue = this.getDaysOverdue();
    // Permitir subir hasta 5 días después de vencido
    return daysOverdue < 5;
  }

  /**
   * Calcula el tiempo restante para el deadline actual
   * Retorna objeto con días, horas y si está vencido
   */
  getTimeRemaining(): {
    days: number;
    hours: number;
    isOverdue: boolean;
    totalHours: number;
  } {
    const now = new Date();
    const currentDeadline = this.getCurrentDeadline();
    const diff = currentDeadline.getTime() - now.getTime();

    if (diff < 0) {
      // Vencido
      return {
        days: 0,
        hours: 0,
        isOverdue: true,
        totalHours: 0,
      };
    }

    const totalHours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    return {
      days,
      hours,
      isOverdue: false,
      totalHours,
    };
  }

  /**
   * Verifica si el plazo actual está vencido
   */
  isOverdue(): boolean {
    const now = new Date();
    const currentDeadline =
      this.finalDeadline || this.extendedDeadline || this.deadline;
    return now > currentDeadline;
  }

  /**
   * Obtiene el plazo activo actual
   */
  getCurrentDeadline(): Date {
    return this.finalDeadline || this.extendedDeadline || this.deadline;
  }

  /**
   * Verifica si está en estado final
   */
  isFinal(): boolean {
    return [
      ComplianceStatus.APPROVED,
      ComplianceStatus.REJECTED,
      ComplianceStatus.ESCALATED,
    ].includes(this.status);
  }

  /**
   * Verifica si puede ser revisado por peer
   */
  canBePeerReviewed(): boolean {
    return this.status === ComplianceStatus.SUBMITTED && !this.peerReviewedBy;
  }

  /**
   * Verifica si necesita acción del moderador
   */
  needsModeratorReview(): boolean {
    return [
      ComplianceStatus.SUBMITTED,
      ComplianceStatus.PEER_APPROVED,
      ComplianceStatus.PEER_OBJECTED,
    ].includes(this.status);
  }
}
