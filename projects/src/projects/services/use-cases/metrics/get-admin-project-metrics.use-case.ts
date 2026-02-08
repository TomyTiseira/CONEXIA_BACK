import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { PostulationStatus } from '../../../../postulations/entities/postulation-status.entity';
import { Postulation } from '../../../../postulations/entities/postulation.entity';
import {
  AdminProjectMetricsDto,
  PostulationsByStatusDto,
  ProjectsByCategoryDto,
} from '../../../dtos/admin-project-metrics.dto';
import { Category } from '../../../entities/category.entity';
import { Project } from '../../../entities/project.entity';
import { ProjectRepository } from '../../../repositories/project.repository';

@Injectable()
export class GetAdminProjectMetricsUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Postulation)
    private readonly postulationRepository: Repository<Postulation>,
    @InjectRepository(PostulationStatus)
    private readonly postulationStatusRepository: Repository<PostulationStatus>,
  ) {}

  async execute(): Promise<AdminProjectMetricsDto> {
    try {
      const now = new Date();

      // 1. Total de proyectos (no eliminados)
      const totalProjects = await this.projectRepository.getTotalCount();

      // 2. Proyectos activos (no eliminados y con fecha de fin futura o sin fecha)
      const activeProjects = await this.projectRepository.getActiveCount();

      // 3. Proyectos con al menos una postulación
      const projectsWithPostulationsResult = await this.projectRepo
        .createQueryBuilder('project')
        .select('COUNT(DISTINCT project.id)', 'count')
        .innerJoin('project.postulations', 'postulation')
        .where('project.deletedAt IS NULL')
        .getRawOne();
      const projectsWithPostulations = parseInt(
        projectsWithPostulationsResult?.count || '0',
      );

      // 4. Proyectos con al menos una postulación aceptada (statusId = 2 'aceptada')
      const projectsWithAcceptedResult = await this.projectRepo
        .createQueryBuilder('project')
        .select('COUNT(DISTINCT project.id)', 'count')
        .innerJoin('project.postulations', 'postulation')
        .where('project.deletedAt IS NULL')
        .andWhere('postulation.statusId = :statusId', { statusId: 2 })
        .getRawOne();
      const projectsWithAcceptedPostulation = parseInt(
        projectsWithAcceptedResult?.count || '0',
      );

      // 5. Total de postulaciones
      const totalPostulations = await this.postulationRepository.count();

      // 6. Promedio de postulaciones por proyecto
      const averagePostulationsPerProject =
        totalProjects > 0 ? totalPostulations / totalProjects : 0;

      // 7. Tasa de engagement (% de proyectos con postulaciones)
      const projectEngagementRate =
        totalProjects > 0
          ? (projectsWithPostulations / totalProjects) * 100
          : 0;

      // 8. Proyectos nuevos (últimos 7, 30, 90 días)
      const date7DaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const date30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const date90DaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const newProjectsLast7Days = await this.projectRepo.count({
        where: {
          createdAt: MoreThanOrEqual(date7DaysAgo),
          deletedAt: null as any,
        },
      });

      const newProjectsLast30Days = await this.projectRepo.count({
        where: {
          createdAt: MoreThanOrEqual(date30DaysAgo),
          deletedAt: null as any,
        },
      });

      const newProjectsLast90Days = await this.projectRepo.count({
        where: {
          createdAt: MoreThanOrEqual(date90DaysAgo),
          deletedAt: null as any,
        },
      });

      // 9. Proyectos por categoría con promedio de postulaciones
      const projectsByCategoryRaw = await this.projectRepo
        .createQueryBuilder('project')
        .select('project.categoryId', 'categoryId')
        .addSelect('category.name', 'categoryName')
        .addSelect('COUNT(DISTINCT project.id)', 'totalProjects')
        .addSelect(
          'COALESCE(AVG(postulation_count.count), 0)',
          'avgPostulations',
        )
        .leftJoin(Category, 'category', 'category.id = project.categoryId')
        .leftJoin(
          (subQuery) => {
            return subQuery
              .select('postulation.project_id', 'projectId')
              .addSelect('COUNT(postulation.id)', 'count')
              .from(Postulation, 'postulation')
              .groupBy('postulation.project_id');
          },
          'postulation_count',
          '"postulation_count"."projectId" = "project"."id"',
        )
        .where('project.deletedAt IS NULL')
        .groupBy('project.categoryId')
        .addGroupBy('category.name')
        .getRawMany();

      const projectsByCategory: ProjectsByCategoryDto[] =
        projectsByCategoryRaw.map((item) => ({
          categoryId: parseInt(item.categoryId),
          categoryName: item.categoryName,
          totalProjects: parseInt(item.totalProjects),
          avgPostulations: parseFloat(
            parseFloat(item.avgPostulations).toFixed(2),
          ),
        }));

      // 10. Postulaciones por estado
      const postulationsByStatusRaw = await this.postulationRepository
        .createQueryBuilder('postulation')
        .select('postulation.statusId', 'statusId')
        .addSelect('status.name', 'statusName')
        .addSelect('COUNT(postulation.id)', 'count')
        .leftJoin(
          PostulationStatus,
          'status',
          'status.id = postulation.statusId',
        )
        .groupBy('postulation.statusId')
        .addGroupBy('status.name')
        .getRawMany();

      const postulationsByStatus: PostulationsByStatusDto[] =
        postulationsByStatusRaw.map((item) => ({
          statusId: parseInt(item.statusId),
          statusName: item.statusName,
          count: parseInt(item.count),
        }));

      // 11. Tasa de aprobación de postulaciones (aceptadas / evaluadas)
      // Solo considera postulaciones evaluadas: aceptadas y rechazadas
      // Excluye activas (sin evaluar) y canceladas (retiradas)
      const acceptedPostulations = await this.postulationRepository.count({
        where: { statusId: 2 }, // Aceptada
      });

      const rejectedPostulations = await this.postulationRepository.count({
        where: { statusId: 3 }, // Rechazada
      });

      const evaluatedPostulations = acceptedPostulations + rejectedPostulations;

      const postulationApprovalRate =
        evaluatedPostulations > 0
          ? (acceptedPostulations / evaluatedPostulations) * 100
          : 0;

      return {
        totalProjects,
        activeProjects,
        projectsWithPostulations,
        projectsWithAcceptedPostulation,
        averagePostulationsPerProject:
          Math.round(averagePostulationsPerProject * 100) / 100,
        projectEngagementRate: Math.round(projectEngagementRate * 100) / 100,
        newProjectsLast7Days,
        newProjectsLast30Days,
        newProjectsLast90Days,
        projectsByCategory,
        postulationsByStatus,
        postulationApprovalRate:
          Math.round(postulationApprovalRate * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting admin project metrics:', error);
      return {
        totalProjects: 0,
        activeProjects: 0,
        projectsWithPostulations: 0,
        projectsWithAcceptedPostulation: 0,
        averagePostulationsPerProject: 0,
        projectEngagementRate: 0,
        newProjectsLast7Days: 0,
        newProjectsLast30Days: 0,
        newProjectsLast90Days: 0,
        projectsByCategory: [],
        postulationsByStatus: [],
        postulationApprovalRate: 0,
      };
    }
  }
}
