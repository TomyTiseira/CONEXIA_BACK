import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Publication } from '../../publications/entities/publication.entity';
import { PublicationReportReason } from '../enums/publication-report-reason.enum';

@Entity('publication_reports')
export class PublicationReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'publication_id' })
  publicationId: number;

  @ManyToOne(() => Publication, { eager: false, nullable: false })
  @JoinColumn({ name: 'publication_id' })
  publication: Publication;

  @Column({ name: 'reporter_id' })
  reporterId: number;

  @Column({
    type: 'enum',
    enum: PublicationReportReason,
  })
  reason: PublicationReportReason;

  @Column({ type: 'text', nullable: true })
  otherReason: string;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
