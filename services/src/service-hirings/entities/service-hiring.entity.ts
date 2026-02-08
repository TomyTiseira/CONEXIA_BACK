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
import { Service } from '../../services/entities/service.entity';
import { TimeUnit } from '../../services/enums/time-unit.enum';
import { Claim } from './claim.entity';
import { Deliverable } from './deliverable.entity';
import { PaymentModality } from './payment-modality.entity';
import { Payment } from './payment.entity';
import { ServiceHiringStatus } from './service-hiring-status.entity';

@Entity('service_hirings')
export class ServiceHiring {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'service_id' })
  serviceId: number;

  @Column({ name: 'status_id' })
  statusId: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  quotedPrice: number;

  @Column({ type: 'int', nullable: true })
  estimatedHours: number;

  @Column({ type: 'enum', enum: TimeUnit, nullable: true })
  estimatedTimeUnit: TimeUnit;

  @Column({ type: 'text', nullable: true })
  quotationNotes: string;

  @Column({ type: 'timestamp', nullable: true })
  quotedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date;

  @Column({ type: 'int', nullable: true })
  quotationValidityDays: number;

  @Column({ type: 'boolean', nullable: true, default: false })
  isBusinessDays: boolean;

  // ✅ NUEVO: Horas aproximadas de trabajo por día
  @Column({ name: 'hours_per_day', type: 'decimal', precision: 5, scale: 2, nullable: true })
  hoursPerDay: number | null;

  // ✅ NUEVO: Si trabaja solo días hábiles (lunes a viernes)
  @Column({ name: 'work_on_business_days_only', type: 'boolean', default: false })
  workOnBusinessDaysOnly: boolean;

  @Column({ type: 'text', nullable: true })
  negotiationDescription: string;

  @Column({ name: 'payment_modality_id', nullable: true })
  paymentModalityId: number;

  @Column({ type: 'timestamp', nullable: true })
  requoteRequestedAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  previousQuotedPrice: number;

  @Column({ name: 'terminated_by_moderation', type: 'boolean', default: false })
  terminatedByModeration: boolean;

  @Column({ name: 'terminated_reason', type: 'text', nullable: true })
  terminatedReason: string | null;

  @Column({ name: 'terminated_at', type: 'timestamp', nullable: true })
  terminatedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  previousQuotedAt: Date;

  @Column({ type: 'int', nullable: true })
  previousQuotationValidityDays: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  requoteCount: number;

  // ✅ NUEVOS CAMPOS: Tracking de pagos
  @Column({ type: 'varchar', length: 255, nullable: true })
  preferenceId: string; // ID de preferencia de MercadoPago

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentId: string; // ID de pago de MercadoPago

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentStatus: string; // Estado del pago: approved, rejected, pending, etc.

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentStatusDetail: string; // Detalle del estado del pago

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date; // Fecha de confirmación del pago

  @Column({ type: 'int', nullable: true, default: 0 })
  retryCount: number; // Número de reintentos de pago

  @ManyToOne(() => ServiceHiringStatus)
  @JoinColumn({ name: 'status_id' })
  status: ServiceHiringStatus;

  @ManyToOne(() => PaymentModality)
  @JoinColumn({ name: 'payment_modality_id' })
  paymentModality: PaymentModality;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @OneToMany(() => Payment, (payment) => payment.hiring)
  payments: Payment[];

  @OneToMany(() => Deliverable, (deliverable) => deliverable.hiring)
  deliverables: Deliverable[];

  @OneToMany(() => Claim, (claim) => claim.hiring)
  claims: Claim[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
