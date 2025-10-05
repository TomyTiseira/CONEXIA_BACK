import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Bank } from './bank.entity';
import { DigitalPlatform } from './digital-platform.entity';
import { User } from './user.entity';

export enum PaymentAccountType {
  BANK_ACCOUNT = 'bank_account',
  DIGITAL_ACCOUNT = 'digital_account',
}

export enum BankAccountType {
  SAVINGS = 'savings',
  CHECKING = 'checking',
}

@Entity('payment_accounts')
export class PaymentAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: PaymentAccountType,
  })
  type: PaymentAccountType;

  @Column({ nullable: true })
  bankId: number;

  @ManyToOne(() => Bank, { nullable: true })
  @JoinColumn({ name: 'bankId' })
  bank: Bank;

  @Column({
    type: 'enum',
    enum: BankAccountType,
    nullable: true,
  })
  bankAccountType: BankAccountType;

  @Column({ nullable: true })
  digitalPlatformId: number;

  @ManyToOne(() => DigitalPlatform, { nullable: true })
  @JoinColumn({ name: 'digitalPlatformId' })
  digitalPlatform: DigitalPlatform;

  @Column()
  cbu: string;

  @Column({ nullable: true })
  alias?: string;

  @Column({ nullable: true })
  customName?: string;

  @Column()
  accountHolderName: string;

  @Column()
  cuilCuit: string;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
