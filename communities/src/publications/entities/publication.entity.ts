import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { PublicationPrivacy } from '../enums/privacy.enum';
import { PublicationComment } from './publication-comment.entity';
import { PublicationMedia } from './publication-media.entity';
import { PublicationReaction } from './publication-reaction.entity';

@Entity('publications')
export class Publication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'media_url', nullable: true })
  mediaUrl: string;

  @Column({ name: 'media_filename', nullable: true })
  mediaFilename: string;

  @Column({ name: 'media_size', nullable: true })
  mediaSize: number;

  @Column({ name: 'media_type', nullable: true })
  mediaType: string; // 'image' | 'video' | 'gif'

  @Column({
    name: 'privacy',
    type: 'enum',
    enum: PublicationPrivacy,
    default: PublicationPrivacy.PUBLIC,
  })
  privacy: PublicationPrivacy;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({
    name: 'ownerModerationStatus',
    type: 'varchar',
    length: 20,
    nullable: true,
    default: null,
  })
  ownerModerationStatus: string | null; // null (activo), 'suspended', 'banned'

  @OneToMany(() => PublicationComment, (comment) => comment.publication, {
    cascade: true,
    eager: false,
  })
  comments: PublicationComment[];

  @OneToMany(() => PublicationReaction, (reaction) => reaction.publication, {
    cascade: true,
    eager: false,
  })
  reactions: PublicationReaction[];

  @OneToMany(() => PublicationMedia, (media) => media.publication, {
    cascade: true,
    eager: false,
  })
  media: PublicationMedia[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
