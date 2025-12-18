import { Injectable } from '@nestjs/common';
import { ProjectDashboardMetricsDto } from '../../../dtos/project-dashboard-metrics.dto';
import { GetProjectsWithPostulationsPercentageUseCase } from './get-projects-with-postulations-percentage.use-case';
import { GetReceivedPostulationsMetricsUseCase } from './get-received-postulations-metrics.use-case';
import { GetSentPostulationsMetricsUseCase } from './get-sent-postulations-metrics.use-case';
import { GetTopProjectsByPostulationsUseCase } from './get-top-projects-by-postulations.use-case';

export interface UserPlanInfo {
  name: string;
  isFreePlan: boolean;
}

@Injectable()
export class GetProjectDashboardMetricsUseCase {
  constructor(
    private readonly getReceivedPostulationsMetrics: GetReceivedPostulationsMetricsUseCase,
    private readonly getSentPostulationsMetrics: GetSentPostulationsMetricsUseCase,
    private readonly getProjectsWithPostulationsPercentage: GetProjectsWithPostulationsPercentageUseCase,
    private readonly getTopProjectsByPostulations: GetTopProjectsByPostulationsUseCase,
  ) {}

  async execute(
    userId: number,
    userPlan: UserPlanInfo,
  ): Promise<ProjectDashboardMetricsDto> {
    try {
      const metrics: ProjectDashboardMetricsDto = {};

      // Plan Free: Métricas básicas de postulaciones
      const receivedPostulations =
        await this.getReceivedPostulationsMetrics.execute(userId);
      const sentPostulations =
        await this.getSentPostulationsMetrics.execute(userId);

      metrics.receivedPostulations = receivedPostulations;
      metrics.sentPostulations = sentPostulations;

      // Plan Basic y Premium: Porcentaje de proyectos con postulaciones
      if (!userPlan.isFreePlan) {
        const percentage =
          await this.getProjectsWithPostulationsPercentage.execute(userId);
        metrics.percentageProjectsWithPostulations = percentage;
      }

      // Plan Premium: Ranking de proyectos con más postulaciones
      if (
        !userPlan.isFreePlan &&
        userPlan.name.toLowerCase().includes('premium')
      ) {
        const topProjects = await this.getTopProjectsByPostulations.execute(
          userId,
          10,
        );
        metrics.topProjectsByPostulations = topProjects;
      }

      return metrics;
    } catch (error) {
      console.error('Error getting project dashboard metrics:', error);
      return {};
    }
  }
}
