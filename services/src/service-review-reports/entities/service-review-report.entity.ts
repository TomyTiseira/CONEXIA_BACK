import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServiceReview } from '../../service-reviews/entities/service-review.entity';
import { ServiceReviewReportReason } from '../enums/service-review-report-reason.enum';

@Entity('service_review_reports')
export class ServiceReviewReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'service_review_id' })
  serviceReviewId: number;

  @ManyToOne(() => ServiceReview, { eager: false, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_review_id' })
  serviceReview: ServiceReview;

  @Column({ name: 'reporter_id' })
  reporterId: number;

  @Column({
    type: 'enum',
    enum: ServiceReviewReportReason,
  })
  reason: ServiceReviewReportReason;

  @Column({ type: 'text', nullable: true, name: 'other_reason' })
  otherReason: string;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
