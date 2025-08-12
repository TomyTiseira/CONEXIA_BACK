import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PostulationStatusCode } from '../enums/postulation-status.enum';

@Entity('postulation_statuses')
export class PostulationStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({
    type: 'enum',
    enum: PostulationStatusCode,
    unique: true,
  })
  code: PostulationStatusCode;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  canTransitionToOthers: boolean;

  @Column({ default: true })
  canBeModified: boolean;

  @Column({ default: false })
  isFinal: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
