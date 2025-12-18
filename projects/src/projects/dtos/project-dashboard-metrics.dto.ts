export class PostulationStatusBreakdown {
  activo: number;
  pendiente_evaluacion: number;
  evaluacion_expirada: number;
  aceptada: number;
  rechazada: number;
  cancelada: number;
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
