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

export class AdminProjectMetricsDto {
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
