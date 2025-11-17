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
import { Postulation } from '../../postulations/entities/postulation.entity';
import { Category } from './category.entity';
import { ProjectRole } from './project-role.entity';

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

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date;

  @OneToMany(() => ProjectRole, (role) => role.project, { cascade: true })
  roles: ProjectRole[];

  @OneToMany(() => Postulation, (postulation) => postulation.project)
  postulations: Postulation[];

  @Column({ name: 'location_id', nullable: true })
  locationId: number;

  // Project-level flags indicating if project requires partner/collaborator
  @Column({ name: 'requires_partner', default: false })
  requiresPartner: boolean;

  @Column({ name: 'requires_investor', default: false })
  requiresInvestor: boolean;

  @Column({ type: 'varchar', nullable: true })
  image?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  deletedReason: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
