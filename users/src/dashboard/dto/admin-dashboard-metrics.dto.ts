// ===== USUARIOS =====
export class NewUsersMetricsDto {
  last7Days: number;
  last30Days: number;
  last90Days: number;
  total: number;
}

export class ActiveUsersMetricsDto {
  last7Days: number;
  last30Days: number;
  last90Days: number;
}

export class VerifiedUsersMetricsDto {
  verified: number;
  verifiedAndActive: number;
  total: number;
  verificationPercentage: number; // Porcentaje de usuarios verificados sobre el total
}

export class UsersMetricsDto {
  newUsers: NewUsersMetricsDto;
  activeUsers: ActiveUsersMetricsDto;
  verifiedUsers: VerifiedUsersMetricsDto;
}

// ===== PROYECTOS =====
export class ProjectsByCategoryDto {
  categoryId: number;
  categoryName: string;
  totalProjects: number;
  avgPostulations: number;
}

export class PostulationsByStatusDto {
  statusId: number;
  statusName: string;
  count: number;
}

export class ProjectsMetricsDto {
  totalProjects: number;
  activeProjects: number;
  projectsWithPostulations: number;
  projectsWithAcceptedPostulation: number;
  averagePostulationsPerProject: number;
  projectEngagementRate: number;
  newProjectsLast7Days: number;
  newProjectsLast30Days: number;
  newProjectsLast90Days: number;
  projectsByCategory: ProjectsByCategoryDto[];
  postulationsByStatus: PostulationsByStatusDto[];
  postulationApprovalRate: number;
}

// ===== SERVICIOS =====
export class ServicesByTypeMetricsDto {
  type: string;
  count: number;
  revenue: number;
}

export class QuotationsMetricsDto {
  sent: number;
  accepted: number;
  acceptanceRate: number; // Porcentaje
}

export class ClaimsMetricsDto {
  totalClaims: number;
  resolvedClaims: number;
  totalServicesHired: number;
  claimRate: number; // Servicios con reclamos / Total de servicios
  resolutionRate: number; // Servicios con reclamo resuelto / Servicios con reclamo
  averageResolutionTimeInHours: number; // Tiempo promedio de resolución en horas
}

export class ServicesMetricsDto {
  totalServicesHired: number;
  totalRevenue: number;
  byType: ServicesByTypeMetricsDto[];
  quotations: QuotationsMetricsDto;
  claims: ClaimsMetricsDto;
}

// ===== MEMBRESÍAS =====
export class UsersByPlanDto {
  planId: number;
  planName: string;
  usersCount: number;
}

export class MembershipsMetricsDto {
  usersByPlan: UsersByPlanDto[];
}

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

// ===== DTO PRINCIPAL =====
export class AdminDashboardMetricsDto {
  users: UsersMetricsDto;
  projects: ProjectsMetricsDto;
  services: ServicesMetricsDto;
  memberships: MembershipsMetricsDto;
  reports: ReportsMetricsDto;
}
