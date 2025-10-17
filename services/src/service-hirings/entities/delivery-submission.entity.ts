import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Deliverable } from './deliverable.entity';
import { ServiceHiring } from './service-hiring.entity';

export enum DeliveryType {
  FULL = 'full', // Para servicios con pago total (se entrega todo de una vez)
  DELIVERABLE = 'deliverable', // Para servicios con pago por entregables (se entrega parcialmente)
}

export enum DeliveryStatus {
  PENDING = 'pending', // Creada pero no enviada
  DELIVERED = 'delivered', // Entregada, esperando revisión del cliente
  APPROVED = 'approved', // Aprobada por el cliente
  REVISION_REQUESTED = 'revision_requested', // Cliente solicita revisión
}

@Entity('delivery_submissions')
export class DeliverySubmission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'hiring_id' })
  hiringId: number;

  @Column({ name: 'deliverable_id', nullable: true })
  deliverableId: number;

  @Column({
    type: 'enum',
    enum: DeliveryType,
    default: DeliveryType.FULL,
  })
  deliveryType: DeliveryType;

  @Column({ type: 'text' })
  content: string; // Texto descriptivo o URL

  @Column({ type: 'varchar', length: 500, nullable: true })
  attachmentPath: string; // Ruta del archivo adjunto

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // Precio correspondiente a esta entrega

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status: DeliveryStatus;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date; // Cuando el prestador envía la entrega

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date; // Cuando el cliente revisa (aprueba o solicita cambios)

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date; // Cuando el cliente aprueba definitivamente

  @Column({ type: 'text', nullable: true })
  revisionNotes: string; // Notas del cliente si solicita revisión

  @ManyToOne(() => ServiceHiring, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hiring_id' })
  hiring: ServiceHiring;

  @ManyToOne(() => Deliverable, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'deliverable_id' })
  deliverable: Deliverable;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
