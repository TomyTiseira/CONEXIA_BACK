import {
  Column,
  DeleteDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from './users.entity';

@Entity()
export class Perfil {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  lastName: string;

  @Column()
  documentNumber: string;

  @Column()
  documentType: string;

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column()
  country: string;

  @Column()
  state: string;

  @Column()
  zipCode: string;

  @OneToOne(() => Users, (user) => user.perfil)
  user: Users;

  @Column({ default: () => 'CURRENT_TIMESTAMP', type: 'timestamp' })
  createdAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
