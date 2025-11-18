import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectRole } from './project-role.entity';

@Entity('role_skills')
export class RoleSkill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'role_id' })
  roleId: number;

  @Column({ name: 'skill_id' })
  skillId: number;

  @ManyToOne(() => ProjectRole, (role) => role.roleSkills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: ProjectRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
