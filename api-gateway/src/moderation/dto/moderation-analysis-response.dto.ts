export class ModerationAnalysisResponseDto {
  id: number;
  userId: number;
  classification: 'Revisar' | 'Banear';
  totalReports: number;
  offensiveReports: number;
  violationReports: number;
  aiSummary: string;
  analyzedReportIds: string[];
  createdAt: Date;
  resolved: boolean;
  resolvedBy?: number;
  resolvedAt?: Date;
  resolutionAction?: 'ban_user' | 'release_user' | 'keep_monitoring' | null;
  resolutionNotes?: string | null;
}
