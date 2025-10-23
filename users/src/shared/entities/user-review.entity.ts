import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_reviews')
export class UserReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  reviewedUserId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewedUserId' })
  reviewedUser: User;

  @Column({ type: 'int' })
  reviewerUserId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewerUserId' })
  reviewerUser: User;

  @Column({ type: 'varchar', length: 100 })
  relationship: string;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
