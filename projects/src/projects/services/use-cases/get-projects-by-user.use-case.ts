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
      limit: data.limit || 10,
    };

    // Obtener proyectos del usuario con paginación
    const [projects, total] = await this.projectRepository.findByUserId(
      data.userId,
      data.includeDeleted,
      params.page,
      params.limit,
    );

    // Transformar los proyectos usando la función común (misma que getProjects)
    const transformedProjects = transformProjectsWithOwners(
      projects,
      users,
      data.currentUserId,
    );

    // Calcular información de paginación usando la función común
    const pagination = calculatePagination(total, params);

    return {
      projects: transformedProjects,
      pagination,
    };
  }
}
