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
  byStatus?: PostulationStatusBreakdown;
}

export class PostulationStatusBreakdown {
  activo: number;
  pendiente_evaluacion: number;
  evaluacion_expirada: number;
  aceptada: number;
  rechazada: number;
  cancelada: number;
  cancelada_moderacion: number;
}

export class ReceivedPostulationsDto {
  total: number;
  byStatus: PostulationStatusBreakdown;
}

export class SentPostulationsDto {
  total: number;
  byStatus: PostulationStatusBreakdown;
}

export class ProjectWithPostulationsRankingDto {
  projectId: number;
  projectTitle: string;
  postulationsCount: number;
}

export class ProjectDashboardMetricsDto {
  // Métricas Free
  receivedPostulations?: ReceivedPostulationsDto;
  sentPostulations?: SentPostulationsDto;

  // Métricas Basic
  percentageProjectsWithPostulations?: number;

  // Métricas Premium
  topProjectsByPostulations?: ProjectWithPostulationsRankingDto[];
}

export class UserDashboardMetricsDto {
  services: ServiceMetricsDto;
  projects: ProjectMetricsDto;
  postulations: PostulationMetricsDto;
  projectDashboard?: ProjectDashboardMetricsDto;
}
