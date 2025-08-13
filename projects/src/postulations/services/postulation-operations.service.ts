import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
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
      statusId: activeStatus.id,
      cvUrl: createPostulationDto.cvUrl,
      cvFilename: createPostulationDto.cvFilename,
      cvSize: createPostulationDto.cvSize,
    };

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
      throw new RpcException({
        status: 500,
        message: `Failed to update postulation ${postulationId} status`,
      });
    }

    return updatedPostulation;
  }

  /**
   * Rechaza una postulación cambiando su estado a rechazado
   * @param postulationId - ID de la postulación
   * @returns La postulación actualizada
   */
  async rejectPostulation(postulationId: number): Promise<Postulation> {
    const rejectedStatus =
      await this.postulationStatusService.getRejectedStatus();

    const updatedPostulation = await this.postulationRepository.updateStatus(
      postulationId,
      rejectedStatus,
    );

    if (!updatedPostulation) {
      throw new RpcException({
        status: 500,
        message: `Failed to update postulation ${postulationId} status`,
      });
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
      throw new RpcException({
        status: 404,
        message: `Postulation with id ${postulationId} not found`,
      });
    }

    // Validar que la postulación tiene un estado válido
    if (!postulation.status) {
      throw new RpcException({
        status: 500,
        message: `Postulation with id ${postulationId} has no valid status. StatusId: ${postulation.statusId}`,
      });
    }

    // Crear el contexto de estado para validar la transición
    const postulationContext = new PostulationContext(postulation);

    // Validar que la postulación puede ser cancelada según su estado actual
    if (!postulationContext.canBeCancelled()) {
      throw new RpcException({
        status: 400,
        message: `Postulation with id ${postulationId} cannot be cancelled in its current state: ${postulationContext.getDisplayName()}`,
      });
    }

    // Validar que puede transicionar al estado cancelado
    if (!postulationContext.canTransitionTo(PostulationStatusCode.CANCELLED)) {
      throw new RpcException({
        status: 400,
        message: `Postulation with id ${postulationId} cannot transition to cancelled state from current state: ${postulationContext.getDisplayName()}`,
      });
    }

    const cancelledStatus =
      await this.postulationStatusService.getCancelledStatus();

    const updatedPostulation = await this.postulationRepository.updateStatus(
      postulationId,
      cancelledStatus,
    );

    if (!updatedPostulation) {
      throw new RpcException({
        status: 500,
        message: `Failed to update postulation ${postulationId} status`,
      });
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
      throw new RpcException({
        status: 500,
        message: `Failed to update postulation ${postulationId} status`,
      });
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
