/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import {
  CvFileTooLargeException,
  InvalidUserRoleException,
  PostulationCreationFailedException,
  ProjectEndedException,
  ProjectNotActiveException,
  ProjectOwnerCannotApplyException,
  UserAlreadyAppliedException,
} from '../../../common/exceptions/postulation.exceptions';
import { ProjectNotFoundException } from '../../../common/exceptions/project.exceptions';
import { ProjectRepository } from '../../../projects/repositories/project.repository';
import { UsersClientService } from '../../../projects/services/users-client.service';
import { CreatePostulationDto } from '../../dtos/create-postulation.dto';
import { Postulation } from '../../entities/postulation.entity';
import { PostulationStatusRepository } from '../../repositories/postulation-status.repository';
import { PostulationRepository } from '../../repositories/postulation.repository';

@Injectable()
export class CreatePostulationUseCase {
  constructor(
    private readonly postulationRepository: PostulationRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly usersClientService: UsersClientService,
    private readonly postulationStatusRepository: PostulationStatusRepository,
  ) {}

  async execute(
    createPostulationDto: CreatePostulationDto,
    currentUserId: number,
  ): Promise<Postulation> {
    // Validar que el proyecto existe y está activo
    const project = await this.projectRepository.findById(
      createPostulationDto.projectId,
    );
    if (!project) {
      throw new ProjectNotFoundException(createPostulationDto.projectId);
    }

    if (!project.isActive || project.deletedAt) {
      throw new ProjectNotActiveException(createPostulationDto.projectId);
    }

    // Validar que el usuario no es el dueño del proyecto
    console.log(project.userId, currentUserId);
    if (project.userId === currentUserId) {
      throw new ProjectOwnerCannotApplyException(
        createPostulationDto.projectId,
        currentUserId,
      );
    }

    // Validar fecha fin del proyecto
    console.log(project.endDate, new Date());
    console.log(new Date() > project.endDate);
    if (project.endDate && new Date() > project.endDate) {
      throw new ProjectEndedException(createPostulationDto.projectId);
    }

    // Validar que el usuario no esté ya postulado
    const existingPostulation =
      await this.postulationRepository.findByProjectAndUser(
        createPostulationDto.projectId,
        currentUserId,
      );

    if (existingPostulation) {
      throw new UserAlreadyAppliedException(
        createPostulationDto.projectId,
        currentUserId,
      );
    }

    // Validar tamaño del CV (10MB = 10 * 1024 * 1024 bytes)
    const maxCvSize = 10 * 1024 * 1024;
    if (createPostulationDto.cvSize > maxCvSize) {
      throw new CvFileTooLargeException();
    }

    // Validar que el usuario tiene rol de user
    try {
      const user = await this.usersClientService.getUserById(currentUserId);

      const userRole = await this.usersClientService.getUserRole(currentUserId);
      if (!user || !userRole || userRole.name !== 'user') {
        throw new InvalidUserRoleException(currentUserId);
      }
    } catch {
      throw new InvalidUserRoleException(currentUserId);
    }

    // Obtener el estado activo
    const activeStatus =
      await this.postulationStatusRepository.findActiveStatus();
    if (!activeStatus) {
      throw new PostulationCreationFailedException();
    }

    // Crear la postulación
    const postulationData: Partial<Postulation> = {
      userId: currentUserId,
      projectId: createPostulationDto.projectId,
      statusId: activeStatus.id,
      cvUrl: createPostulationDto.cvUrl,
      cvFilename: createPostulationDto.cvFilename,
      cvSize: createPostulationDto.cvSize,
    };

    try {
      return await this.postulationRepository.create(postulationData);
    } catch {
      throw new PostulationCreationFailedException();
    }
  }
}
