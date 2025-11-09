/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InvalidUserRoleException } from '../../../common/exceptions/postulation.exceptions';
import { UsersClientService } from '../../../common/services/users-client.service';
import { CreatePostulationDto } from '../../dtos/create-postulation.dto';
import { PostulationOperationsService } from '../postulation-operations.service';
import { PostulationValidationService } from '../postulation-validation.service';

@Injectable()
export class CreatePostulationUseCase {
  constructor(
    private readonly postulationValidationService: PostulationValidationService,
    private readonly postulationOperationsService: PostulationOperationsService,
    private readonly usersClientService: UsersClientService,
  ) {}

  async execute(
    createPostulationDto: CreatePostulationDto,
    currentUserId: number,
  ) {
    // Validar que el proyecto existe y está activo
    const project =
      await this.postulationValidationService.validateProjectExistsAndActive(
        createPostulationDto.projectId,
      );

    // Validar que el role existe y pertenece al proyecto
    await this.postulationValidationService.validateRoleExists(
      createPostulationDto.roleId,
      createPostulationDto.projectId,
    );

    // Validar que el usuario no es el dueño del proyecto
    this.postulationValidationService.validateUserNotProjectOwner(
      project,
      currentUserId,
    );

    // Validar que el proyecto no ha terminado
    this.postulationValidationService.validateProjectNotEnded(project);

    // Validar que el usuario no esté ya postulado
    // ahora validamos por role (no por proyecto)
    await this.postulationValidationService.validateUserNotAlreadyApplied(
      createPostulationDto.roleId,
      currentUserId,
    );

    // Validar que no se haya alcanzado el máximo de colaboradores aprobados POR ROLE
    await this.postulationValidationService.validateRoleHasAvailableSlots(
      createPostulationDto.roleId,
    );

    // Validar tamaño del CV
    if (createPostulationDto.cvSize) {
      this.postulationValidationService.validateCvFileSize(
        createPostulationDto.cvSize,
      );
    }

    // Validar que el usuario tiene rol de user
    await this.validateUserRole(currentUserId);

    // Validar que el usuario esté verificado
    await this.usersClientService.validateUserIsVerified(currentUserId);

    // Crear la postulación
    return await this.postulationOperationsService.createPostulation(
      createPostulationDto,
      currentUserId,
    );
  }

  /**
   * Valida que el usuario tiene el rol correcto
   * @param currentUserId - ID del usuario actual
   */
  private async validateUserRole(currentUserId: number): Promise<void> {
    try {
      const user = await this.usersClientService.getUserById(currentUserId);
      const userRole = await this.usersClientService.getUserRole(currentUserId);

      if (!user || !userRole || userRole.name !== 'user') {
        throw new InvalidUserRoleException(currentUserId);
      }
    } catch {
      throw new InvalidUserRoleException(currentUserId);
    }
  }
}
