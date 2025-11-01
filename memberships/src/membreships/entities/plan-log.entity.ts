import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('plan_logs')
export class PlanLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  adminUserId: number;

  @Column({ type: 'varchar', length: 20 })
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate';

  @Column({ type: 'json', nullable: true })
  changes?: unknown;

  @CreateDateColumn()
  createdAt: Date;
}
