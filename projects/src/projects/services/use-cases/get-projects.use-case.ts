import { Injectable } from '@nestjs/common';
import { UsersClientService } from '../../../common/services/users-client.service';
import { calculatePagination } from '../../../common/utils/pagination.utils';
import { transformProjectsWithOwners } from '../../../common/utils/project-transform.utils';
import { PostulationRepository } from '../../../postulations/repositories/postulation.repository';
import { GetProjectsDto } from '../../dtos/get-projects.dto';
import { Project } from '../../entities/project.entity';
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

    // Obtener los IDs de proyectos a los que el usuario ya se postuló
    const userPostulations =
      await this.postulationRepository.findByUserWithState(
        currentUserId,
        1,
        10000,
      );
    const appliedProjectIds = new Set(
      (userPostulations[0] || []).map((p: any) => p.projectId),
    );

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

    // Transformar los proyectos usando la función común
    const transformedProjects = transformProjectsWithOwners(
      projects,
      users,
      currentUserId,
      skillsMap,
      appliedProjectIds,
      approvedApplicationsMap,
    );

    // Calcular información de paginación usando solo los proyectos donde no es dueño
    const pagination = calculatePagination(notOwnerIds.length, params);

    return {
      projects: transformedProjects,
      pagination,
    };
  }
}
