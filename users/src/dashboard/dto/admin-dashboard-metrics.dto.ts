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

export class ProjectsStatusMetricsDto {
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
  completionRate: number; // Porcentaje de proyectos completados
}

export class ServicesByTypeMetricsDto {
  type: string;
  count: number;
  revenue: number; // En ARS
}

export class ServicesMetricsDto {
  totalServicesHired: number;
  totalRevenue: number; // En ARS
  byType: ServicesByTypeMetricsDto[];
}

export class AdminDashboardMetricsDto {
  newUsers: NewUsersMetricsDto;
  activeUsers: ActiveUsersMetricsDto;
  projects: ProjectsStatusMetricsDto;
  services: ServicesMetricsDto;
}
