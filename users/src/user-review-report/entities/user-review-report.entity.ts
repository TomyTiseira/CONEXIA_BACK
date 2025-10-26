import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserReview } from '../../shared/entities/user-review.entity';
import { UserReviewReportReason } from '../enums/user-review-report-reason.enum';

@Entity('user_review_reports')
export class UserReviewReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_review_id' })
  userReviewId: number;

  @ManyToOne(() => UserReview, { eager: false, nullable: false })
  @JoinColumn({ name: 'user_review_id' })
  userReview: UserReview;

  @Column({ name: 'reporter_id' })
  reporterId: number;

  @Column({
    type: 'enum',
    enum: UserReviewReportReason,
  })
  reason: UserReviewReportReason;

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
