import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { PostulationStatus } from './postulation-status.entity';

@Entity('postulations')
export class Postulation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'project_id' })
  projectId: number;

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

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
