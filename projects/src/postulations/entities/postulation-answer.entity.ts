import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Postulation } from './postulation.entity';
import { RoleQuestion } from '../../projects/entities/role-question.entity';

@Entity('postulation_answers')
export class PostulationAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'postulation_id' })
  postulationId: number;

  @ManyToOne(() => Postulation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postulation_id' })
  postulation: Postulation;

  @Column({ name: 'question_id' })
  questionId: number;

  @ManyToOne(() => RoleQuestion)
  @JoinColumn({ name: 'question_id' })
  question: RoleQuestion;

  @Column({ name: 'option_id', nullable: true })
  optionId?: number;

  @Column({ name: 'answer_text', type: 'text', nullable: true })
  answerText?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
