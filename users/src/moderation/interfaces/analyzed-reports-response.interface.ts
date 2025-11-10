export interface ReportDetail {
  id: number;
  reporterId: number;
  reason: string;
  otherReason: string | null;
  description: string;
  createdAt: Date;
  isActive: boolean;
  updatedAt: Date;
  reportedUserId: number | null;
  resourceTitle: string | null;
  resourceDescription: string | null;
  // Campos específicos según el tipo
  serviceId?: number;
  projectId?: number;
  publicationId?: number;
}

export interface AnalyzedReportsResponse {
  analysisId: number;
  userId: number;
  firstName: string | null;
  lastName: string | null;
  totalReports: number;
  classification: string;
  aiSummary: string;
  createdAt: Date;
  reports: {
    services: ReportDetail[];
    projects: ReportDetail[];
    publications: ReportDetail[];
  };
}
