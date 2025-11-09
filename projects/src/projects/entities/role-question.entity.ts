import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProjectRole } from './project-role.entity';
import { RoleQuestionOption } from './role-question-option.entity';

@Entity('role_questions')
export class RoleQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'role_id' })
  roleId: number;

  @ManyToOne(() => ProjectRole, (r) => r.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: ProjectRole;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column({ name: 'question_type' })
  questionType: string; // OPEN | MULTIPLE_CHOICE

  @Column({ default: true })
  required: boolean;

  @OneToMany(() => RoleQuestionOption, (o) => o.question, { cascade: true })
  options: RoleQuestionOption[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
