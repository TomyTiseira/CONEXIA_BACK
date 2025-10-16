import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServiceHiring } from './service-hiring.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
}

export enum PaymentType {
  INITIAL = 'initial', // 25% anticipo para full_payment
  FINAL = 'final', // 75% restante para full_payment
  FULL = 'full', // 100% para cotizaciones antiguas
  DELIVERABLE = 'deliverable', // Pago por entregable individual
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  hiringId: number;

  @ManyToOne(() => ServiceHiring, (hiring) => hiring.payments)
  @JoinColumn({ name: 'hiringId' })
  hiring: ServiceHiring;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.FULL,
  })
  paymentType: PaymentType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalAmount: number;

  @Column({ nullable: true })
  deliverableId: number;

  @Column({ nullable: true })
  mercadoPagoPaymentId: string;

  @Column({ nullable: true })
  mercadoPagoPreferenceId: string;

  @Column({ type: 'json', nullable: true })
  mercadoPagoResponse: any;

  @Column({ nullable: true })
  mercadoPagoPaymentMethodId: string;

  @Column({ nullable: true })
  mercadoPagoPaymentTypeId: string;

  @Column({ nullable: true })
  failureReason: string;

  @Column({ nullable: true, type: 'timestamp' })
  processedAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
