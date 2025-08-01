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

    const [projects, total] =
      await this.projectRepository.findProjectsWithFilters(params);

    // Obtener información de los dueños de los proyectos
    const userIds = [...new Set(projects.map((project) => project.userId))];
    const users = await this.usersClientService.getUsersByIds(userIds);

    // Transformar los proyectos usando la función común
    const transformedProjects = transformProjectsWithOwners(
      projects,
      users,
      currentUserId,
    );

    // Calcular información de paginación usando la función común
    const pagination = calculatePagination(total, params);

    return {
      projects: transformedProjects,
      pagination,
    };
  }
}
