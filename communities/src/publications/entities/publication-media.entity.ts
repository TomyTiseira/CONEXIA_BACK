import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Publication } from './publication.entity';

@Entity('publication_media')
export class PublicationMedia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'publication_id' })
  publicationId: number;

  @Column({ name: 'file_url' })
  fileUrl: string;

  @Column({ name: 'filename' })
  filename: string;

  @Column({ name: 'file_type' })
  fileType: string; // 'image/jpeg', 'image/png', 'image/gif', 'video/mp4'

  @Column({ name: 'file_size' })
  fileSize: number;

  @Column({ name: 'display_order', default: 1 })
  displayOrder: number;

  @ManyToOne(() => Publication, (publication) => publication.media, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'publication_id' })
  publication: Publication;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
