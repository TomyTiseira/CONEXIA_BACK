export class ServiceMetricsDto {
  totalServicesHired: number;
  totalRevenueGenerated: number; // En ARS
}

export class ProjectMetricsDto {
  totalProjectsEstablished: number; // Proyectos completados con al menos un colaborador
}

export class PostulationMetricsDto {
  totalPostulations: number;
  acceptedPostulations: number;
  successRate: number; // Porcentaje de éxito
}

export class UserDashboardMetricsDto {
  services: ServiceMetricsDto;
  projects: ProjectMetricsDto;
  postulations: PostulationMetricsDto;
}
