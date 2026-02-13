import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TimeUnit } from '../enums/time-unit.enum';
import { ServiceCategory } from './category.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  title: string;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  categoryId: number;

  @ManyToOne(() => ServiceCategory)
  @JoinColumn({ name: 'categoryId' })
  category: ServiceCategory;

  @Column({ type: 'int', nullable: true })
  estimatedHours: number | null;

  @Column({ type: 'enum', enum: TimeUnit, nullable: true, default: 'hours' })
  timeUnit: TimeUnit | null;

  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  deleteReason: string | null;

  @Column({ name: 'hidden_by_moderation', type: 'boolean', default: false })
  hiddenByModeration: boolean;

  @Column({ name: 'moderation_reason', type: 'text', nullable: true })
  moderationReason: string | null;

  @Column({ name: 'moderation_updated_at', type: 'timestamp', nullable: true })
  moderationUpdatedAt: Date | null;

  @Column({
    name: 'owner_moderation_status',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  ownerModerationStatus: string | null; // null (activo), 'suspended', 'banned'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
