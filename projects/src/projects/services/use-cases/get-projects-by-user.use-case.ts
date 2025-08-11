import { Injectable } from '@nestjs/common';
import { UserNotFoundException } from '../../../common/exceptions/project.exceptions';
import { calculatePagination } from '../../../common/utils/pagination.utils';
import { transformProjectsWithOwners } from '../../../common/utils/project-transform.utils';
import { GetProjectsByUserDto } from '../../dtos/get-projects-by-user.dto';
import { ProjectRepository } from '../../repositories/project.repository';
import { UsersClientService } from '../users-client.service';

@Injectable()
export class GetProjectsByUserUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly usersClientService: UsersClientService,
  ) {}

  async execute(data: GetProjectsByUserDto) {
    // Obtener información del usuario propietario usando el mismo método que getProjects
    const users = await this.usersClientService.getUsersByIds([data.userId]);
    if (!users || users.length === 0) {
      throw new UserNotFoundException(data.userId);
    }

    // Configurar parámetros de paginación
    const params = {
      page: data.page || 1,
      limit: data.limit || 12,
    };

    // Obtener proyectos del usuario con paginación
    const [projects, total] = await this.projectRepository.findByUserId(
      data.userId,
      data.includeDeleted,
      params.page,
      params.limit,
    );

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

    // Transformar los proyectos usando la función común (misma que getProjects)
    const transformedProjects = transformProjectsWithOwners(
      projects,
      users,
      data.currentUserId,
      skillsMap,
    );

    // Calcular información de paginación usando la función común
    const pagination = calculatePagination(total, params);

    return {
      projects: transformedProjects,
      pagination,
    };
  }
}
