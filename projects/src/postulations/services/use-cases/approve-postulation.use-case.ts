import { Injectable } from '@nestjs/common';
import { ApprovePostulationDto } from 'src/postulations/dtos/approve-postulation.dto';
import { PostulationOperationsService } from '../postulation-operations.service';
import { PostulationValidationService } from '../postulation-validation.service';

@Injectable()
export class ApprovePostulationUseCase {
  constructor(
    private readonly postulationValidationService: PostulationValidationService,
    private readonly postulationOperationsService: PostulationOperationsService,
  ) {}

  async execute(approvePostulationDto: ApprovePostulationDto) {
    // Validar que la postulación existe
    const postulation =
      await this.postulationValidationService.validatePostulationExists(
        approvePostulationDto.postulationId,
      );

    // Validar que el proyecto está activo
    const project =
      await this.postulationValidationService.validateProjectExistsAndActive(
        postulation.projectId,
      );

    // Validar que el usuario es el dueño del proyecto
    this.postulationValidationService.validateUserIsProjectOwner(
      project,
      approvePostulationDto.currentUserId,
    );

    // Validar que la postulación está en estado pendiente
    await this.postulationValidationService.validatePostulationIsPending(
      postulation,
    );

    // Validar que el proyecto no ha terminado
    this.postulationValidationService.validateProjectNotEnded(project);

    // Validar que el proyecto tiene slots disponibles
    await this.postulationValidationService.validateProjectHasAvailableSlots(
      postulation.projectId,
      project.maxCollaborators,
    );

    // Aprobar la postulación
    return await this.postulationOperationsService.approvePostulation(
      postulation.id,
    );
  }
}
