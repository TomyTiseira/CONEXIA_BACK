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

  @ManyToOne(() => ServiceHiringStatus)
  @JoinColumn({ name: 'status_id' })
  status: ServiceHiringStatus;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @OneToMany(() => Payment, (payment) => payment.hiring)
  payments: Payment[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
