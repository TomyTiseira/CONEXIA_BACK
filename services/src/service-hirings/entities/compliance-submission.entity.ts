import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClaimCompliance } from './claim-compliance.entity';

/**
 * Entidad que representa un intento de cumplimiento (submission).
 * Mantiene historial completo de todas las evidencias enviadas.
 */
@Entity('claim_compliance_submissions')
export class ComplianceSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============ RELACIÓN CON COMPLIANCE ============
  @Column({ name: 'compliance_id', type: 'uuid' })
  complianceId: string;

  @ManyToOne(() => ClaimCompliance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'compliance_id' })
  compliance: ClaimCompliance;

  // ============ NÚMERO DE INTENTO ============
  @Column({ name: 'attempt_number', type: 'int' })
  attemptNumber: number;

  // ============ ESTADO DE ESTA SUBMISSION ============
  @Column({ type: 'varchar', length: 50 })
  status: string; // 'pending_review', 'approved', 'rejected', 'requires_adjustment'

  // ============ EVIDENCIA DEL USUARIO ============
  @Column({ name: 'evidence_urls', type: 'simple-array', nullable: true })
  evidenceUrls: string[] | null;

  @Column({ name: 'user_notes', type: 'text', nullable: true })
  userNotes: string | null;

  @Column({ name: 'submitted_at', type: 'timestamp' })
  submittedAt: Date;

  // ============ REVISIÓN DEL MODERADOR ============
  @Column({ name: 'reviewed_by', type: 'varchar', length: 255, nullable: true })
  reviewedBy: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({
    name: 'moderator_decision',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  moderatorDecision: string | null; // 'approve', 'reject', 'adjust'

  @Column({ name: 'moderator_notes', type: 'text', nullable: true })
  moderatorNotes: string | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  // ============ PEER REVIEW ============
  @Column({
    name: 'peer_reviewed_by',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  peerReviewedBy: string | null;

  @Column({ name: 'peer_approved', type: 'boolean', nullable: true })
  peerApproved: boolean | null;

  @Column({ name: 'peer_review_reason', type: 'text', nullable: true })
  peerReviewReason: string | null;

  @Column({ name: 'peer_reviewed_at', type: 'timestamp', nullable: true })
  peerReviewedAt: Date | null;

  // ============ AUDITORÍA ============
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
