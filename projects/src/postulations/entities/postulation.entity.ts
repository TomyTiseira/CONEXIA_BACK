import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ProjectRole } from '../../projects/entities/project-role.entity';
import { Project } from '../../projects/entities/project.entity';
import { PostulationAnswer } from './postulation-answer.entity';
import { PostulationStatus } from './postulation-status.entity';

@Entity('postulations')
@Index(['userId', 'roleId'], { unique: true })
export class Postulation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'project_id' })
  projectId: number;

  @Column({ name: 'role_id', nullable: true })
  roleId?: number;

  @Column({ name: 'status_id' })
  statusId: number;

  @ManyToOne(() => PostulationStatus)
  @JoinColumn({ name: 'status_id' })
  status: PostulationStatus;

  @Column({ name: 'cv_url', nullable: true })
  cvUrl: string;

  @Column({ name: 'cv_filename', nullable: true })
  cvFilename: string;

  @Column({ name: 'cv_size', nullable: true })
  cvSize: number;

  @Column({ name: 'evaluation_submission_url', nullable: true })
  evaluationSubmissionUrl?: string;

  @Column({ name: 'evaluation_submission_filename', nullable: true })
  evaluationSubmissionFilename?: string;

  @Column({ name: 'evaluation_submission_size', nullable: true })
  evaluationSubmissionSize?: number;

  @Column({ name: 'evaluation_submission_mimetype', nullable: true })
  evaluationSubmissionMimetype?: string;

  @Column({ name: 'evaluation_link', nullable: true })
  evaluationLink?: string;

  @Column({ name: 'evaluation_description', type: 'text', nullable: true })
  evaluationDescription?: string;

  @Column({ name: 'evaluation_deadline', type: 'timestamp', nullable: true })
  evaluationDeadline?: Date;

  @Column({ name: 'evaluation_submitted_at', type: 'timestamp', nullable: true })
  evaluationSubmittedAt?: Date;

  @Column({ name: 'investor_amount', type: 'numeric', nullable: true })
  investorAmount?: number;

  @Column({ name: 'investor_message', type: 'text', nullable: true })
  investorMessage?: string;

  @Column({ name: 'partner_description', type: 'text', nullable: true })
  partnerDescription?: string;

  @Column({ name: 'cancelled_by_moderation', type: 'boolean', default: false })
  cancelledByModeration: boolean;

  @Column({ name: 'moderation_cancelled_at', type: 'timestamp', nullable: true })
  moderationCancelledAt: Date | null;

  @Column({ name: 'moderation_cancel_reason', type: 'text', nullable: true })
  moderationCancelReason: string | null;

  @ManyToOne(() => ProjectRole)
  @JoinColumn({ name: 'role_id' })
  role?: ProjectRole;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => PostulationAnswer, (answer) => answer.postulation)
  answers?: PostulationAnswer[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
