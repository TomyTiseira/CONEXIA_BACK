export interface ReportResponseDto {
  id: number;
  reason: string;
  otherReason?: string;
  description: string;
  createdAt: Date;
  projectId: number;
  reporterId: number;
  reporter: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}
