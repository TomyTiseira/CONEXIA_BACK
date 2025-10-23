export interface ReportData {
  id: number;
  reporterId: number;
  reason: string;
  otherReason?: string;
  description: string;
  createdAt: Date;
  isActive: boolean;
  updatedAt: Date;
  source: 'projects' | 'services' | 'publications';
  reportedUserId: number; // El usuario al que pertenece el proyecto/servicio/publicación
  publicationId?: number;
  serviceId?: number;
  projectId?: number;
}

export interface UserReportsGroup {
  userId: number;
  reports: ReportData[];
}

export interface OpenAIModerationResult {
  flagged: boolean;
  categories: {
    sexual: boolean;
    hate: boolean;
    harassment: boolean;
    'self-harm': boolean;
    'sexual/minors': boolean;
    'hate/threatening': boolean;
    'violence/graphic': boolean;
    'self-harm/intent': boolean;
    'self-harm/instructions': boolean;
    'harassment/threatening': boolean;
    violence: boolean;
  };
  category_scores: {
    sexual: number;
    hate: number;
    harassment: number;
    'self-harm': number;
    'sexual/minors': number;
    'hate/threatening': number;
    'violence/graphic': number;
    'self-harm/intent': number;
    'self-harm/instructions': number;
    'harassment/threatening': number;
    violence: number;
  };
}

export interface NotificationPayload {
  analysisId: number;
  userId: number;
  classification: 'Revisar' | 'Banear';
  totalReports: number;
  aiSummary: string;
}
