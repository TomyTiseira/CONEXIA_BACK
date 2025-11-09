import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProjectRole } from './project-role.entity';

@Entity('role_evaluations')
export class RoleEvaluation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'role_id' })
  roleId: number;

  @ManyToOne(() => ProjectRole, (r) => r.evaluations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: ProjectRole;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  link?: string;

  @Column({ name: 'file_url', nullable: true })
  fileUrl?: string;

  @Column({ name: 'file_name', nullable: true })
  fileName?: string;

  @Column({ name: 'file_size', nullable: true })
  fileSize?: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
