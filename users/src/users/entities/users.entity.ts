import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Perfil } from './perfil.entity';
import { Role } from './role.entity';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  isValidate: boolean;

  @Column({ nullable: true })
  verificationCode: string;

  @Column({ nullable: true, type: 'timestamp' })
  verificationCodeExpires: Date;

  @Column()
  roleId: number;

  @ManyToOne(() => Role, (role) => role.id)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ nullable: true })
  perfilId: number;

  @OneToOne(() => Perfil, (perfil) => perfil.user)
  @JoinColumn({ name: 'perfilId' })
  perfil: Perfil;

  @Column({ default: () => 'CURRENT_TIMESTAMP', type: 'timestamp' })
  createdAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
