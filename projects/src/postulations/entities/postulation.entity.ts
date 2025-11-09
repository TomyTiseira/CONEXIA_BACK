import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { PostulationStatus } from './postulation-status.entity';
import { ProjectRole } from '../../projects/entities/project-role.entity';

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

  @Column({ name: 'investor_amount', type: 'numeric', nullable: true })
  investorAmount?: number;

  @Column({ name: 'investor_message', type: 'text', nullable: true })
  investorMessage?: string;

  @Column({ name: 'partner_description', type: 'text', nullable: true })
  partnerDescription?: string;

  @ManyToOne(() => ProjectRole)
  @JoinColumn({ name: 'role_id' })
  role?: ProjectRole;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
