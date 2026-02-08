import { Injectable } from '@nestjs/common';
import {
  ProjectAlreadyDeletedException,
  ProjectNotFoundException,
  ProjectNotOwnedByUserException,
} from '../../../common/exceptions/project.exceptions';
import { Project } from '../../entities/project.entity';
import { ProjectRepository } from '../../repositories/project.repository';

@Injectable()
export class DeleteProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(
    projectId: number,
    reason: string,
    userId: number,
  ): Promise<Project> {
    // Buscar el proyecto por ID
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new ProjectNotFoundException(projectId);
    }

    // Validar que el proyecto no esté eliminado
    if (project.deletedAt) {
      throw new ProjectAlreadyDeletedException(projectId);
    }

    // Validar que el proyecto pertenezca al usuario que lo quiere eliminar
    if (project.userId !== userId) {
      throw new ProjectNotOwnedByUserException(projectId, userId);
    }

    // Realizar la baja lógica del proyecto
    await this.projectRepository.deleteProject(project, reason);

    return project;
  }
}
