import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('moderation_actions')
export class ModerationAction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @Column({ name: 'action_type', type: 'varchar', length: 50 })
  actionType: 'banned' | 'suspended' | 'reactivated' | 'released';

  @Column({ name: 'moderator_id', type: 'integer', nullable: true })
  moderatorId: number | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ name: 'analysis_id', type: 'integer', nullable: true })
  analysisId: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    commitments_at_time?: {
      services: number;
      own_projects: number;
      collaborations: number;
    };
    suspension_days?: number;
    suspension_expires_at?: string;
    emails_sent?: string[];
    content_affected?: {
      services_terminated?: number[];
      services_hidden?: number[];
      projects_suspended?: number[];
      postulations_cancelled?: number[];
    };
    is_automatic_reactivation?: boolean;
  } | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
