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

  @Column()
  phoneNumber: string;

  @Column()
  country: string;

  @Column()
  state: string;

  @Column()
  userId: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: () => 'CURRENT_TIMESTAMP', type: 'timestamp' })
  createdAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
