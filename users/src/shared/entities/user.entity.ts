import { Profile } from 'src/profile/entities/profile.entity';
import {
    Column,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  isValidate: boolean;

  @Column({ default: false })
  verified: boolean;

  @Column({ name: 'is_profile_complete', type: 'boolean', default: false, nullable: true })
  isProfileComplete: boolean | null;

  @Column({ nullable: true })
  verificationCode: string;

  @Column({ nullable: true, type: 'timestamp' })
  verificationCodeExpires: Date;

  @Column()
  roleId: number;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ nullable: true })
  profileId: number;

  @OneToOne(() => Profile, (profile) => profile.id)
  @JoinColumn({ name: 'profileId' })
  profile: Profile;

  @Column({ nullable: true })
  passwordResetCode: string;

  @Column({ nullable: true, type: 'timestamp' })
  passwordResetCodeExpires: Date;

  @Column({ nullable: true })
  deletedReason: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @Column({
    name: 'last_activity_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Última vez que el usuario hizo login',
  })
  lastActivityAt: Date;
}
