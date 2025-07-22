import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DocumentType } from '../../shared/entities/document-type.entity';
import { User } from '../../shared/entities/user.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  lastName: string;

  @Column()
  documentNumber: string;

  @Column()
  documentTypeId: number;

  @ManyToOne(() => DocumentType)
  @JoinColumn({ name: 'documentTypeId' })
  documentType: DocumentType;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  state: string;

  @Column()
  userId: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'date', nullable: true })
  birthDate: Date;

  @Column({ type: 'varchar', nullable: true })
  profilePicture?: string;

  @Column({ type: 'varchar', nullable: true })
  coverPicture?: string;

  @Column('simple-array', { nullable: true })
  skills: string[];

  @Column({ length: 500, nullable: true })
  description: string;

  @Column('simple-json', { nullable: true })
  experience: { title: string; project: string }[];

  @Column('simple-json', { nullable: true })
  socialLinks: { platform: string; url: string }[];

  @Column({ default: () => 'CURRENT_TIMESTAMP', type: 'timestamp' })
  createdAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
