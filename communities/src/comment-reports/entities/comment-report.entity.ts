import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PublicationComment } from '../../publications/entities/publication-comment.entity';
import { CommentReportReason } from '../enums/comment-report-reason.enum';

@Entity('comment_reports')
export class CommentReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'comment_id' })
  commentId: number;

  @ManyToOne(() => PublicationComment, { eager: false, nullable: false })
  @JoinColumn({ name: 'comment_id' })
  comment: PublicationComment;

  @Column({ name: 'reporter_id' })
  reporterId: number;

  @Column({
    type: 'enum',
    enum: CommentReportReason,
  })
  reason: CommentReportReason;

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
