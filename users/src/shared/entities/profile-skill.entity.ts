import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Profile } from '../../profile/entities/profile.entity';

@Entity('profile_skills')
export class ProfileSkill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  profileId: number;

  @Column()
  skillId: number;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profileId' })
  profile: Profile;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
