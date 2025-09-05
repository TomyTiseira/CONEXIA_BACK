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

/**
 * Tipo de reacción que puede tener una publicación
 */
export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  SUPPORT = 'support',
  CELEBRATE = 'celebrate',
  INSIGHTFUL = 'insightful',
  FUN = 'fun',
}

@Entity('publication_reactions')
export class PublicationReaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'type',
    type: 'enum',
    enum: ReactionType,
    default: ReactionType.LIKE,
  })
  type: ReactionType;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'publication_id' })
  publicationId: number;

  @ManyToOne(() => Publication, (publication) => publication.reactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'publication_id' })
  publication: Publication;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
