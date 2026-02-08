import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RoleQuestion } from './role-question.entity';

@Entity('role_question_options')
export class RoleQuestionOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'question_id' })
  questionId: number;

  @ManyToOne(() => RoleQuestion, (q) => q.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: RoleQuestion;

  @Column({ name: 'option_text' })
  optionText: string;

  @Column({ name: 'is_correct', default: false })
  isCorrect: boolean;
}
