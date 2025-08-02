/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { UserNotFoundException } from '../../../common/exceptions/project.exceptions';
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
    // Obtener información del usuario propietario
    const ownerData = await this.usersClientService.getUserWithProfile(
      data.userId,
    );
    if (!ownerData) {
      throw new UserNotFoundException(data.userId);
    }

    // Obtener proyectos del usuario
    const projects = await this.projectRepository.findByUserId(
      data.userId,
      data.includeDeleted,
    );

    const users = [ownerData];

    // Transformar los proyectos usando la función común (misma que getProjects)
    const transformedProjects = transformProjectsWithOwners(
      projects,
      users,
      data.currentUserId,
    );

    return {
      projects: transformedProjects,
      pagination: {
        total: projects.length,
        page: 1,
        limit: projects.length,
        totalPages: 1,
      },
    };
  }
}
