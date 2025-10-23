import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Service } from '../../services/entities/service.entity';
import { ServiceReportReason } from '../enums/service-report-reason.enum';

@Entity('service_reports')
export class ServiceReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'service_id' })
  serviceId: number;

  @ManyToOne(() => Service, { eager: false, nullable: false })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ name: 'reporter_id' })
  reporterId: number;

  @Column({
    type: 'enum',
    enum: ServiceReportReason,
  })
  reason: ServiceReportReason;

  @Column({ type: 'text', nullable: true })
  otherReason: string;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
