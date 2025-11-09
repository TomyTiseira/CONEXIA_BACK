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
import { Project } from './project.entity';
import { RoleQuestion } from './role-question.entity';
import { RoleEvaluation } from './role-evaluation.entity';

@Entity('project_roles')
export class ProjectRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id' })
  projectId: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: 1 })
  vacancies: number;

  @Column({ name: 'application_type' })
  applicationType: string;

  @OneToMany(() => RoleQuestion, (q) => q.role, { cascade: true })
  questions: RoleQuestion[];

  @OneToMany(() => RoleEvaluation, (e) => e.role, { cascade: true })
  evaluations: RoleEvaluation[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
