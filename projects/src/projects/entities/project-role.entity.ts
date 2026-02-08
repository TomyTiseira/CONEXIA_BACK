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
import { RoleSkill } from './role-skill.entity';
import { ContractType } from './contract-type.entity';
import { CollaborationType } from './collaboration-type.entity';

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


  @Column({ name: 'application_types', type: 'simple-array', nullable: true })
  applicationTypes: string[];

  @Column({ name: 'contract_type_id', nullable: true })
  contractTypeId?: number;

  @ManyToOne(() => ContractType)
  @JoinColumn({ name: 'contract_type_id' })
  contractType?: ContractType;

  @Column({ name: 'collaboration_type_id', nullable: true })
  collaborationTypeId?: number;

  @ManyToOne(() => CollaborationType)
  @JoinColumn({ name: 'collaboration_type_id' })
  collaborationType?: CollaborationType;

  @Column({ nullable: true })
  maxCollaborators?: number;

  @OneToMany(() => RoleSkill, (rs) => rs.role, { cascade: true })
  roleSkills?: RoleSkill[];

  @OneToMany(() => RoleQuestion, (q) => q.role, { cascade: true })
  questions: RoleQuestion[];

  @OneToMany(() => RoleEvaluation, (e) => e.role, { cascade: true })
  evaluations: RoleEvaluation[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
