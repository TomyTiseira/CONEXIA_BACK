import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { CollaborationType } from './collaboration-type.entity';
import { ContractType } from './contract-type.entity';
import { ProjectSkill } from './project-skill.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column()
  categoryId: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  collaborationTypeId: number;

  @ManyToOne(() => CollaborationType)
  @JoinColumn({ name: 'collaborationTypeId' })
  collaborationType: CollaborationType;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date;

  @OneToMany(() => ProjectSkill, (projectSkill) => projectSkill.project, {
    cascade: true,
  })
  projectSkills: ProjectSkill[];

  @Column({ nullable: true })
  location: string;

  @Column()
  contractTypeId: number;

  @ManyToOne(() => ContractType)
  @JoinColumn({ name: 'contractTypeId' })
  contractType: ContractType;

  @Column({ nullable: true })
  maxCollaborators: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
