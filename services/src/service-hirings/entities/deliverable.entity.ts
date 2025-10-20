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

export enum DeliverableStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  DELIVERED = 'delivered',
  APPROVED = 'approved',
  REVISION_REQUESTED = 'revision_requested', // Cliente solicita revisión del entregable
  REJECTED = 'rejected',
}

@Entity('deliverables')
export class Deliverable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'hiring_id' })
  hiringId: number;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({ type: 'date' })
  estimatedDeliveryDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  orderIndex: number;

  @Column({
    type: 'enum',
    enum: DeliverableStatus,
    default: DeliverableStatus.PENDING,
  })
  status: DeliverableStatus;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @ManyToOne(() => ServiceHiring, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hiring_id' })
  hiring: ServiceHiring;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
