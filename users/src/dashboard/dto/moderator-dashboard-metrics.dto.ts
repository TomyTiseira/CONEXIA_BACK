// ===== USUARIOS - MODERACIÓN =====
export class UserModerationMetricsDto {
  suspendedUsers: number;
  bannedUsers: number;
  totalUsers: number;
  activeUsers: number; // Sin sanciones
}

// ===== REPORTES =====
export class ReportsByStatusDto {
  status: string;
  count: number;
}

export class ReportsByTypeDto {
  type: string;
  count: number;
  active: number;
  resolved: number;
}

export class ReportsByReasonDto {
  reason: string;
  count: number;
  active: number;
  resolved: number;
}

export class ReportsMetricsDto {
  totalReports: number;
  activeReports: number;
  resolvedReports: number;
  byStatus: ReportsByStatusDto[];
  byType: ReportsByTypeDto[];
  byReason: ReportsByReasonDto[];
}

// ===== RECLAMOS DE SERVICIOS =====
export class ClaimsMetricsDto {
  totalClaims: number;
  resolvedClaims: number;
  servicesInProgress: number;
  totalServicesHired: number;
  claimRate: number;
  resolutionRate: number;
  averageResolutionTimeInHours: number;
}

// ===== DASHBOARD COMPLETO DE MODERADOR =====
export class ModeratorDashboardMetricsDto {
  userModeration: UserModerationMetricsDto;
  reports: ReportsMetricsDto;
  claims: ClaimsMetricsDto;
}
