import { Injectable } from '@nestjs/common';
import { UsersClientService } from '../../../common/services/users-client.service';
import { calculatePagination } from '../../../common/utils/pagination.utils';
import { transformProjectsWithOwners } from '../../../common/utils/project-transform.utils';
import { PostulationRepository } from '../../../postulations/repositories/postulation.repository';
import { GetProjectsDto } from '../../dtos/get-projects.dto';
import { ProjectRepository } from '../../repositories/project.repository';

@Injectable()
export class GetProjectsUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly usersClientService: UsersClientService,
    private readonly postulationRepository: PostulationRepository,
  ) {}

  async execute(getProjectsDto: GetProjectsDto, currentUserId: number) {
    const params = {
      ...getProjectsDto,
      page: getProjectsDto.page || 1,
      limit: getProjectsDto.limit || 10,
    };

    // Obtener proyectos con filtros aplicados directamente en la base de datos
    // Esto evita cargar miles de registros en memoria
    const [projects, total] =
      await this.projectRepository.findProjectsWithFilters({
        ...params,
        excludeUserId: currentUserId, // Excluir proyectos del usuario actual
        onlyActive: true, // Solo proyectos activos (no vencidos)
      });

    // Obtener información de los dueños de los proyectos
    const userIds = [...new Set(projects.map((project) => project.userId))];
    const users = await this.usersClientService.getUsersByIds(userIds);

    // Obtener todas las skill IDs de todos los proyectos
    const allSkillIds = [
      ...new Set(
        projects.flatMap(
          (project) => project.projectSkills?.map((ps) => ps.skillId) || [],
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

    // Obtener las postulaciones del usuario autenticado SOLO para los proyectos actuales
    const projectIds = projects.map((p) => p.id);
    let userPostulationsArr: any[] = [];
    if (projectIds.length > 0) {
      userPostulationsArr =
        (await this.postulationRepository.findByUserForProjects(
          currentUserId,
          projectIds,
        )) || [];
    }
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

    // Obtener la cantidad de postulaciones aprobadas para cada proyecto EN BATCH
    let approvedApplicationsMap = new Map<number, number>();
    if (projects.length > 0) {
      const statusAccepted = 2; // Ajusta este valor si el ID de estado "aprobada" es diferente
      const projectIds = projects.map((p) => p.id);
      approvedApplicationsMap =
        await this.postulationRepository.getApprovedCountsByProjects(
          projectIds,
          statusAccepted,
        );
    }

    // Transformar los proyectos usando la función común
    const transformedProjects = transformProjectsWithOwners(
      projects,
      users,
      currentUserId,
      skillsMap,
      appliedProjectIds,
      approvedApplicationsMap,
      postulationStatusMap,
    );

    // Calcular información de paginación usando el total correcto
    const pagination = calculatePagination(total, params);

    return {
      projects: transformedProjects,
      pagination,
    };
  }
}
