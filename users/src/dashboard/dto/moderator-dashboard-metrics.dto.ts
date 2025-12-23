// ===== REPORTES =====
export class ReportsByStatusDto {
  status: string;
  count: number;
}

export class ReportsByTypeDto {
  type: string;
  count: number;
}

export class ReportsByReasonDto {
  reason: string;
  count: number;
}

export class ReportsMetricsDto {
  totalReports: number;
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
  reports: ReportsMetricsDto;
  claims: ClaimsMetricsDto;
}
