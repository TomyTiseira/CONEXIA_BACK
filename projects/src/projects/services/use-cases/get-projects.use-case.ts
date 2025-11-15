import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UsersClientService } from '../../../common/services/users-client.service';
import { calculatePagination } from '../../../common/utils/pagination.utils';
import { transformProjectsWithOwners } from '../../../common/utils/project-transform.utils';
import { PostulationRepository } from '../../../postulations/repositories/postulation.repository';
import { ReportRepository } from '../../../reports/repositories/report.repository';
import { GetProjectsDto } from '../../dtos/get-projects.dto';
import { Project } from '../../entities/project.entity';
import { ProjectRepository } from '../../repositories/project.repository';

@Injectable()
export class GetProjectsUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly usersClientService: UsersClientService,
    private readonly postulationRepository: PostulationRepository,
    @Inject(forwardRef(() => ReportRepository))
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute(getProjectsDto: GetProjectsDto, currentUserId: number) {
    const params = {
      ...getProjectsDto,
      page: getProjectsDto.page || 1,
      limit: getProjectsDto.limit || 10,
    };

    // 1. Obtener todos los IDs de proyectos donde el usuario NO es dueño
    const [allProjects] = await this.projectRepository.findProjectsWithFilters({
      ...params,
      page: 1,
      limit: 10000,
    });
    const now = new Date();
    const notOwnerIds = allProjects
      .filter((p) => p.userId !== currentUserId)
      .filter((p) => !p.endDate || new Date(p.endDate) >= now)
      .map((p) => p.id);

    // 2. Paginar sobre esos IDs
    const start = (params.page - 1) * params.limit;
    const end = start + params.limit;
    const paginatedIds = notOwnerIds.slice(start, end);

    // 3. Traer los proyectos completos con relaciones usando los IDs paginados
    let projects: Project[] = [];
    if (paginatedIds.length > 0) {
      projects = await this.projectRepository.findProjectsByIds(paginatedIds);
    }

    // Obtener información de los dueños de los proyectos
    const userIds = [...new Set(projects.map((project) => project.userId))];
    const users = await this.usersClientService.getUsersByIds(userIds);

    // Obtener todas las skill IDs de todos los proyectos (desde roles)
    const allSkillIds = [
      ...new Set(
        projects.flatMap((project) =>
          project.roles?.flatMap((role) => role.roleSkills?.map((rs) => rs.skillId) || []) || [],
        ),
      ),
    ];

    // Obtener información de las skills si hay skill IDs
    let skillsMap: Map<number, string> = new Map();
    if (allSkillIds.length > 0) {
      const skills = await this.usersClientService.getSkillsByIds(allSkillIds);
      skillsMap = new Map(
        skills.map((skill: { id: number; name: string }) => [
          skill.id,
          skill.name,
        ]),
      );
    }

    // Obtener las postulaciones del usuario autenticado a los proyectos listados
    const userPostulationsArr =
      (
        await this.postulationRepository.findByUserWithState(
          currentUserId,
          1,
          10000,
        )
      )[0] || [];
    const appliedProjectIds = new Set(
      userPostulationsArr.map((p: any) => p.projectId),
    );

    // Mapear la última postulación por proyecto (por fecha de creación)
    // Usar objeto auxiliar interno para comparar createdAt
    const postulationStatusAux: Map<
      number,
      { code: string; createdAt: string }
    > = new Map();
    userPostulationsArr.forEach((p: any) => {
      const prev = postulationStatusAux.get(p.projectId);
      if (!prev || new Date(p.createdAt as string) > new Date(prev.createdAt)) {
        postulationStatusAux.set(p.projectId, {
          code: String(p.status?.code || ''),
          createdAt: String(p.createdAt),
        });
      }
    });
    // Limpiar el objeto para solo dejar el code
    const postulationStatusMap: Map<number, { code: string }> = new Map();
    for (const [k, v] of postulationStatusAux.entries()) {
      postulationStatusMap.set(k, { code: v.code });
    }

    // Obtener la cantidad de postulaciones aprobadas para cada proyecto
    const approvedApplicationsMap = new Map<number, number>();
    if (projects.length > 0) {
      const statusAccepted = 2; // Ajusta este valor si el ID de estado "aprobada" es diferente
      for (const project of projects) {
        const [, count] =
          await this.postulationRepository.findAndCountWithFilters(
            { projectId: project.id, statusId: statusAccepted },
            1,
            1,
          );
        approvedApplicationsMap.set(project.id, count);
      }
    }

    // Verificar si el usuario reportó cada proyecto (batch query)
    const hasReportedMap = new Map<number, boolean>();
    if (currentUserId && projects.length > 0) {
      const reportPromises = projects.map(async (project) => {
        // Si es el dueño, no puede reportar su propio proyecto
        if (currentUserId === project.userId) {
          return { projectId: project.id, hasReported: false };
        }
        const report = await this.reportRepository.findByProjectAndReporter(
          project.id,
          currentUserId,
        );
        return { projectId: project.id, hasReported: report !== null };
      });
      const results = await Promise.all(reportPromises);
      results.forEach(({ projectId, hasReported }) => {
        hasReportedMap.set(projectId, hasReported);
      });
    }

    // Transformar los proyectos usando la función común
    // Obtener mapas de contract y collaboration types como fallback en caso de que las relaciones no vengan pobladas
    const contractTypes = await this.projectRepository.findAllContractTypes();
    const collaborationTypes = await this.projectRepository.findAllCollaborationTypes();
    const contractTypeMap = new Map(contractTypes.map((c) => [c.id, c.name]));
    const collaborationTypeMap = new Map(
      collaborationTypes.map((c) => [c.id, c.name]),
    );

    const transformedProjects = transformProjectsWithOwners(
      projects,
      users,
      currentUserId,
      skillsMap,
      appliedProjectIds,
      approvedApplicationsMap,
      postulationStatusMap,
      contractTypeMap,
      collaborationTypeMap,
    );

    // Agregar el campo hasReported a cada proyecto
    const projectsWithReportStatus = transformedProjects.map((project) => ({
      ...project,
      hasReported: hasReportedMap.get(project.id) ?? false,
    }));

    // Calcular información de paginación usando solo los proyectos donde no es dueño
    const pagination = calculatePagination(notOwnerIds.length, params);

    return {
      projects: projectsWithReportStatus,
      pagination,
    };
  }
}
