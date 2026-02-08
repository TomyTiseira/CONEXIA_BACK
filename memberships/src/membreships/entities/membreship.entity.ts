import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Plan } from './plan.entity';

export enum SubscriptionStatus {
  PENDING_PAYMENT = 'pending_payment', // Esperando pago
  ACTIVE = 'active', // Suscripción activa
  PAYMENT_FAILED = 'payment_failed', // Pago fallido
  CANCELLED = 'cancelled', // Cancelada por el usuario
  EXPIRED = 'expired', // Expirada por falta de renovación
  REPLACED = 'replaced', // Reemplazada por una nueva suscripción
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number; // Referencia al usuario del microservicio users

  @Column({ name: 'plan_id' })
  planId: number;

  @ManyToOne(() => Plan, { eager: true })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({
    type: 'enum',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING_PAYMENT,
  })
  status: SubscriptionStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // Precio al momento de contratar

  // Fechas de vigencia
  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date | null;

  // Datos de MercadoPago
  @Column({
    name: 'preference_id',
    type: 'varchar',
    nullable: true,
    length: 255,
  })
  preferenceId: string;

  @Column({
    name: 'payment_id',
    type: 'varchar',
    nullable: true,
    length: 255,
  })
  paymentId: string;

  // MercadoPago Subscription ID (preapproval_id) para suscripciones recurrentes
  @Column({
    name: 'mercado_pago_subscription_id',
    type: 'varchar',
    nullable: true,
    length: 255,
  })
  mercadoPagoSubscriptionId: string | null;

  @Column({
    name: 'payment_status',
    type: 'varchar',
    nullable: true,
    length: 50,
  })
  paymentStatus: string; // approved, rejected, pending, etc.

  @Column({
    name: 'payment_status_detail',
    type: 'varchar',
    nullable: true,
    length: 255,
  })
  paymentStatusDetail: string;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  // Control de renovación
  @Column({ name: 'auto_renew', default: true })
  autoRenew: boolean;

  @Column({ name: 'next_payment_date', type: 'timestamp', nullable: true })
  nextPaymentDate: Date | null;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  // Información del método de pago
  @Column({
    name: 'payment_method_type',
    type: 'varchar',
    nullable: true,
    length: 50,
  })
  paymentMethodType: string | null; // credit_card, debit_card, etc.

  @Column({
    name: 'card_last_four_digits',
    type: 'varchar',
    nullable: true,
    length: 4,
  })
  cardLastFourDigits: string | null; // Últimos 4 dígitos de la tarjeta

  @Column({
    name: 'card_brand',
    type: 'varchar',
    nullable: true,
    length: 50,
  })
  cardBrand: string | null; // visa, mastercard, etc.

  // Suscripción que esta reemplaza (si es un upgrade/downgrade)
  @Column({ name: 'replaces_subscription_id', type: 'int', nullable: true })
  replacesSubscriptionId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;
}
