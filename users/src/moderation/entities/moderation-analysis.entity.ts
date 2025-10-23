import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('reports_moderation_analysis')
export class ModerationAnalysis {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @Column({ name: 'analyzed_report_ids', type: 'text', array: true })
  analyzedReportIds: string[];

  @Column({ name: 'total_reports', type: 'integer', default: 0 })
  totalReports: number;

  @Column({ name: 'offensive_reports', type: 'integer', default: 0 })
  offensiveReports: number;

  @Column({ name: 'violation_reports', type: 'integer', default: 0 })
  violationReports: number;

  @Column({
    type: 'varchar',
    length: 50,
  })
  classification: 'Revisar' | 'Banear';

  @Column({ name: 'ai_summary', type: 'text' })
  aiSummary: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'boolean', default: false })
  resolved: boolean;

  @Column({ name: 'resolved_by', type: 'integer', nullable: true })
  resolvedBy: number | null;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  @Column({
    name: 'resolution_action',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  resolutionAction: 'ban_user' | 'release_user' | 'keep_monitoring' | null;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes: string | null;

  @Column({ type: 'boolean', default: false })
  notified: boolean;

  @Column({ name: 'notified_at', type: 'timestamp', nullable: true })
  notifiedAt: Date | null;
}
