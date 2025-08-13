import { Injectable } from '@nestjs/common';
import { CancelPostulationDto } from '../../dtos/cancel-postulation.dto';
import { PostulationOperationsService } from '../postulation-operations.service';
import { PostulationValidationService } from '../postulation-validation.service';

@Injectable()
export class CancelPostulationUseCase {
  constructor(
    private readonly postulationValidationService: PostulationValidationService,
    private readonly postulationOperationsService: PostulationOperationsService,
  ) {}

  async execute(cancelPostulationDto: CancelPostulationDto) {
    // Validar que la postulación existe
    const postulation =
      await this.postulationValidationService.validatePostulationExists(
        cancelPostulationDto.postulationId,
      );

    // Validar que el proyecto está activo
    await this.postulationValidationService.validateProjectExistsAndActive(
      postulation.projectId,
    );

    // Validar que el usuario es el dueño de la postulación
    this.postulationValidationService.validateUserIsPostulationOwner(
      postulation,
      cancelPostulationDto.currentUserId,
    );

    // Cancelar la postulación (el patrón State se encarga de validar el estado)
    const cancelledPostulation =
      await this.postulationOperationsService.cancelPostulation(postulation.id);

    return cancelledPostulation;
  }
}
