import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import {
    ClaimResolutionType,
    ClaimRole,
    ClaimStatus,
    ClaimType,
} from '../enums/claim.enum';
import { ServiceHiring } from './service-hiring.entity';

@Entity('claims')
export class Claim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con el servicio contratado
  @Column({ name: 'hiring_id', type: 'int' })
  hiringId: number;

  @ManyToOne(() => ServiceHiring, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hiring_id' })
  hiring: ServiceHiring;

  // Quién hace el reclamo
  @Column({ name: 'claimant_user_id', type: 'int' })
  claimantUserId: number;

  @Column({
    name: 'claimant_role',
    type: 'enum',
    enum: ClaimRole,
  })
  claimantRole: ClaimRole;

  // Detalles del reclamo
  @Column({
    name: 'claim_type',
    type: 'enum',
    enum: ClaimType,
  })
  claimType: ClaimType;

  @Column({ type: 'text' })
  description: string;

  // Motivo especificado cuando el tipo es "*_other"
  @Column({ name: 'other_reason', type: 'varchar', length: 30, nullable: true })
  otherReason?: string | null;

  // Evidencias (URLs de archivos subidos)
  @Column({
    name: 'evidence_urls',
    type: 'jsonb',
    nullable: true,
    default: [],
  })
  evidenceUrls: string[];

  // Estado del reclamo
  @Column({
    type: 'enum',
    enum: ClaimStatus,
    default: ClaimStatus.OPEN,
  })
  status: ClaimStatus;

  // Estado anterior del hiring (para restaurar al resolver)
  @Column({ name: 'previous_hiring_status_id', type: 'int', nullable: true })
  previousHiringStatusId: number | null;

  // Observaciones del moderador (para "Pendiente subsanación")
  @Column({ type: 'text', nullable: true })
  observations: string | null;

  @Column({ name: 'observations_by', type: 'int', nullable: true })
  observationsBy: number | null;

  @Column({ name: 'observations_at', type: 'timestamp', nullable: true })
  observationsAt: Date | null;

  // Respuesta del usuario al subsanar observaciones (no pisa la descripción original)
  @Column({ name: 'clarification_response', type: 'text', nullable: true })
  clarificationResponse: string | null;

  // Resolución (cuando se cierre el reclamo)
  @Column({ type: 'text', nullable: true })
  resolution: string | null;

  @Column({
    name: 'resolution_type',
    type: 'enum',
    enum: ClaimResolutionType,
    nullable: true,
  })
  resolutionType: ClaimResolutionType | null;

  @Column({
    name: 'partial_agreement_details',
    type: 'text',
    nullable: true,
  })
  partialAgreementDetails: string | null;

  @Column({ name: 'resolved_by', type: 'int', nullable: true })
  resolvedBy: number | null;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  // Auditoría
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
