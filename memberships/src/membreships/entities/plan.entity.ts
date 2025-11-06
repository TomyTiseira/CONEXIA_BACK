import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthlyPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  annualPrice: number;

  // JSON structure like [{ key: string, value: boolean|number|string }]
  @Column({ type: 'json', nullable: true })
  benefits?: Array<{ key: string; value: unknown }>;

  // Shows if plan is available for new users
  @Column({ default: true })
  active: boolean;

  // MercadoPago Plan ID for monthly subscriptions
  @Column({
    name: 'mercado_pago_plan_id_monthly',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  mercadoPagoPlanIdMonthly: string | null;

  // MercadoPago Plan ID for annual subscriptions
  @Column({
    name: 'mercado_pago_plan_id_annual',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  mercadoPagoPlanIdAnnual: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date | null;
}
