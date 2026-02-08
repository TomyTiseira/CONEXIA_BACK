import { Injectable } from '@nestjs/common';
import {
  PostulationCannotBeCancelledException,
  PostulationCannotBeRejectedException,
  PostulationCannotTransitionToCancelledException,
  PostulationCannotTransitionToRejectedException,
  PostulationHasNoValidStatusException,
  PostulationNotFoundException,
  PostulationStatusUpdateFailedException,
} from 'src/common/exceptions/postulation.exceptions';
import { CreatePostulationDto } from '../dtos/create-postulation.dto';
import { Postulation } from '../entities/postulation.entity';
import { PostulationStatusCode } from '../enums/postulation-status.enum';
import { PostulationRepository } from '../repositories/postulation.repository';
import { PostulationContext } from '../states/postulation-context';
import { PostulationStatusService } from './postulation-status.service';

@Injectable()
export class PostulationOperationsService {
  constructor(
    private readonly postulationRepository: PostulationRepository,
    private readonly postulationStatusService: PostulationStatusService,
  ) {}

  /**
   * Crea una nueva postulación
   * @param createPostulationDto - DTO con los datos de la postulación
   * @param currentUserId - ID del usuario actual
   * @returns La postulación creada
   */
  async createPostulation(
    createPostulationDto: CreatePostulationDto,
    currentUserId: number,
  ): Promise<Postulation> {
    const activeStatus = await this.postulationStatusService.getActiveStatus();

    const postulationData: Partial<Postulation> = {
      userId: currentUserId,
      projectId: createPostulationDto.projectId,
      roleId: createPostulationDto.roleId,
      statusId: activeStatus.id,
      cvUrl: createPostulationDto.cvUrl,
      cvFilename: createPostulationDto.cvFilename,
      cvSize: createPostulationDto.cvSize,
      investorAmount: createPostulationDto.investorAmount,
      investorMessage: createPostulationDto.investorMessage,
      partnerDescription: createPostulationDto.partnerDescription,
    };

    // Si vienen respuestas, usar createWithAnswers para guardar todo en una transacción
    if (
      createPostulationDto.answers &&
      createPostulationDto.answers.length > 0
    ) {
      return await this.postulationRepository.createWithAnswers(
        postulationData,
        createPostulationDto.answers,
      );
    }

    return await this.postulationRepository.create(postulationData);
  }

  /**
   * Aproba una postulación cambiando su estado a aceptado
   * @param postulationId - ID de la postulación
   * @returns La postulación actualizada
   */
  async approvePostulation(postulationId: number): Promise<Postulation> {
    const acceptedStatus =
      await this.postulationStatusService.getAcceptedStatus();

    const updatedPostulation = await this.postulationRepository.updateStatus(
      postulationId,
      acceptedStatus,
    );

    if (!updatedPostulation) {
      throw new PostulationStatusUpdateFailedException(postulationId);
    }

    return updatedPostulation;
  }

  /**
   * Rechaza una postulación cambiando su estado a rechazado
   * @param postulationId - ID de la postulación
   * @returns La postulación actualizada
   */
  async rejectPostulation(postulationId: number): Promise<Postulation> {
    // Obtener la postulación con su estado actual
    const postulation =
      await this.postulationRepository.findByIdWithState(postulationId);
    if (!postulation) {
      throw new PostulationNotFoundException(postulationId);
    }

    // Validar que la postulación tiene un estado válido
    if (!postulation.status) {
      throw new PostulationHasNoValidStatusException(
        postulationId,
        postulation.statusId,
      );
    }

    // Crear el contexto de estado para validar la transición
    const postulationContext = new PostulationContext(postulation);

    // Validar que la postulación puede ser rechazada según su estado actual
    if (!postulationContext.canBeRejected()) {
      throw new PostulationCannotBeRejectedException(
        postulationId,
        postulationContext.getDisplayName(),
      );
    }

    // Validar que puede transicionar al estado rechazado
    if (!postulationContext.canTransitionTo(PostulationStatusCode.REJECTED)) {
      throw new PostulationCannotTransitionToRejectedException(
        postulationId,
        postulationContext.getDisplayName(),
      );
    }

    const rejectedStatus =
      await this.postulationStatusService.getRejectedStatus();

    const updatedPostulation = await this.postulationRepository.updateStatus(
      postulationId,
      rejectedStatus,
    );

    if (!updatedPostulation) {
      throw new PostulationStatusUpdateFailedException(postulationId);
    }

    return updatedPostulation;
  }

  /**
   * Cancela una postulación cambiando su estado a cancelado
   * @param postulationId - ID de la postulación
   * @returns La postulación actualizada
   */
  async cancelPostulation(postulationId: number): Promise<Postulation> {
    // Obtener la postulación con su estado actual
    const postulation =
      await this.postulationRepository.findByIdWithState(postulationId);
    if (!postulation) {
      throw new PostulationNotFoundException(postulationId);
    }

    // Validar que la postulación tiene un estado válido
    if (!postulation.status) {
      throw new PostulationHasNoValidStatusException(
        postulationId,
        postulation.statusId,
      );
    }

    // Crear el contexto de estado para validar la transición
    const postulationContext = new PostulationContext(postulation);

    // Validar que la postulación puede ser cancelada según su estado actual
    if (!postulationContext.canBeCancelled()) {
      throw new PostulationCannotBeCancelledException(
        postulationId,
        postulationContext.getDisplayName(),
      );
    }

    // Validar que puede transicionar al estado cancelado
    if (!postulationContext.canTransitionTo(PostulationStatusCode.CANCELLED)) {
      throw new PostulationCannotTransitionToCancelledException(
        postulationId,
        postulationContext.getDisplayName(),
      );
    }

    const cancelledStatus =
      await this.postulationStatusService.getCancelledStatus();

    const updatedPostulation = await this.postulationRepository.updateStatus(
      postulationId,
      cancelledStatus,
    );

    if (!updatedPostulation) {
      throw new PostulationStatusUpdateFailedException(postulationId);
    }

    return updatedPostulation;
  }

  /**
   * Cambia el estado de una postulación a un estado específico
   * @param postulationId - ID de la postulación
   * @param statusCode - Código del nuevo estado
   * @returns La postulación actualizada
   */
  async changePostulationStatus(
    postulationId: number,
    statusCode: string,
  ): Promise<Postulation> {
    const status = await this.postulationStatusService.getByCode(
      statusCode as any,
    );

    const updatedPostulation = await this.postulationRepository.updateStatus(
      postulationId,
      status,
    );

    if (!updatedPostulation) {
      throw new PostulationStatusUpdateFailedException(postulationId);
    }

    return updatedPostulation;
  }

  /**
   * Obtiene todas las postulaciones de un proyecto con un estado específico
   * @param projectId - ID del proyecto
   * @param statusCode - Código del estado a filtrar
   * @returns Lista de postulaciones con el estado especificado
   */
  async getPostulationsByProjectAndStatus(
    projectId: number,
    statusCode: string,
  ): Promise<Postulation[]> {
    const status = await this.postulationStatusService.getByCode(
      statusCode as any,
    );
    const allPostulations =
      await this.postulationRepository.findByProject(projectId);

    return allPostulations.filter((p) => p.statusId === status.id);
  }

  /**
   * Cuenta las postulaciones de un proyecto con un estado específico
   * @param projectId - ID del proyecto
   * @param statusCode - Código del estado a contar
   * @returns Número de postulaciones con el estado especificado
   */
  async countPostulationsByProjectAndStatus(
    projectId: number,
    statusCode: string,
  ): Promise<number> {
    const postulations = await this.getPostulationsByProjectAndStatus(
      projectId,
      statusCode,
    );
    return postulations.length;
  }
}
