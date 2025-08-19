import { Report } from '../entities/report.entity';
import { ReportResponseDto } from '../response/report-response.dto';

export interface UserWithProfile {
  id: number;
  email: string;
  profile?: {
    firstName: string;
    lastName: string;
  };
}

export function transformReportsWithUsers(
  reports: Report[],
  users: UserWithProfile[],
): ReportResponseDto[] {
  const usersMap = new Map(users.map((user) => [user.id, user]));

  return reports.map((report) => {
    const user = usersMap.get(report.reporterId);

    return {
      id: report.id,
      reason: report.reason,
      otherReason: report.otherReason,
      description: report.description,
      createdAt: report.createdAt,
      projectId: report.projectId,
      reporterId: report.reporterId,
      reporter: user
        ? {
            id: user.id,
            email: user.email,
            firstName: user.profile?.firstName || 'N/A',
            lastName: user.profile?.lastName || 'N/A',
          }
        : {
            id: report.reporterId,
            email: 'Usuario no encontrado',
            firstName: 'N/A',
            lastName: 'N/A',
          },
    };
  });
}
