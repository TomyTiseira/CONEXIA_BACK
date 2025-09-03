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
import { Publication } from './publication.entity';

@Entity('publication_comments')
export class PublicationComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'publication_id' })
  publicationId: number;

  @ManyToOne(() => Publication, (publication) => publication.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'publication_id' })
  publication: Publication;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
