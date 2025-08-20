import { Injectable } from '@nestjs/common';
import { calculatePagination } from '../../../common/utils/pagination.utils';
import { transformProjectsWithOwners } from '../../../common/utils/project-transform.utils';
import { GetProjectsDto } from '../../dtos/get-projects.dto';
import { ProjectRepository } from '../../repositories/project.repository';
import { UsersClientService } from '../users-client.service';

@Injectable()
export class GetProjectsUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly usersClientService: UsersClientService,
  ) {}

  async execute(getProjectsDto: GetProjectsDto, currentUserId: number) {
    const params = {
      ...getProjectsDto,
      page: getProjectsDto.page || 1,
      limit: getProjectsDto.limit || 10,
    };

    const [projects] =
      await this.projectRepository.findProjectsWithFilters(params);

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

    // Transformar los proyectos usando la función común
    const transformedProjects = transformProjectsWithOwners(
      projects,
      users,
      currentUserId,
      skillsMap,
    );

    // Filtrar proyectos donde el usuario NO es dueño
    const notOwnerProjects = transformedProjects.filter((p) => !p.isOwner);
    const totalNotOwner = notOwnerProjects.length;

    // Calcular información de paginación usando solo los proyectos donde no es dueño
    const pagination = calculatePagination(totalNotOwner, params);

    return {
      projects: transformedProjects,
      pagination,
    };
  }
}
