import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ name: 'user_id' })
  userId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
