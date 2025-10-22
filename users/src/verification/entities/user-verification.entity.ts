import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../shared/entities/user.entity';

@Entity('user_verifications')
export class UserVerification {
  @PrimaryGeneratedColumn()
  verificationId: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  documentNumberExtracted: string;

  @Column({ default: false })
  documentNumberMatch: boolean;

  @Column({ type: 'float', nullable: true })
  similarityScore: number;

  @Column({ default: false })
  matchResult: boolean;

  @Column({ nullable: true })
  documentType: string;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP', type: 'timestamp' })
  createdAt: Date;
}
