import { Injectable } from '@nestjs/common';
import { PostulationStatusNotFoundException } from '../../common/exceptions/postulation.exceptions';
import { PostulationStatus } from '../entities/postulation-status.entity';
import { PostulationStatusCode } from '../enums/postulation-status.enum';
import { PostulationStatusRepository } from '../repositories/postulation-status.repository';
import { PostulationStatusResponseDto } from '../response/postulation-status-response.dto';

@Injectable()
export class PostulationStatusService {
  constructor(
    private readonly postulationStatusRepository: PostulationStatusRepository,
  ) {}

  /**
   * Obtiene un estado de postulación por su código
   * @param code - Código del estado
   * @returns Estado de postulación o null si no existe
   */
  async getByCode(code: PostulationStatusCode): Promise<PostulationStatus> {
    const status = await this.postulationStatusRepository.findByCode(code);
    if (!status) {
      throw new PostulationStatusNotFoundException();
    }
    return status;
  }

  /**
   * Obtiene el estado activo (pendiente)
   * @returns Estado activo de postulación
   */
  async getActiveStatus(): Promise<PostulationStatus> {
    return this.getByCode(PostulationStatusCode.ACTIVE);
  }

  /**
   * Obtiene el estado aceptado
   * @returns Estado aceptado de postulación
   */
  async getAcceptedStatus(): Promise<PostulationStatus> {
    return this.getByCode(PostulationStatusCode.ACCEPTED);
  }

  /**
   * Obtiene el estado rechazado
   * @returns Estado rechazado de postulación
   */
  async getRejectedStatus(): Promise<PostulationStatus> {
    return this.getByCode(PostulationStatusCode.REJECTED);
  }

  /**
   * Obtiene el estado cancelado
   * @returns Estado cancelado de postulación
   */
  async getCancelledStatus(): Promise<PostulationStatus> {
    return this.getByCode(PostulationStatusCode.CANCELLED);
  }

  /**
   * Obtiene el estado pendiente de evaluación
   * @returns Estado pendiente de evaluación de postulación
   */
  async getPendingEvaluationStatus(): Promise<PostulationStatus> {
    return this.getByCode(PostulationStatusCode.PENDING_EVALUATION);
  }

  /**
   * Obtiene el estado de evaluación expirada
   * @returns Estado de evaluación expirada de postulación
   */
  async getEvaluationExpiredStatus(): Promise<PostulationStatus> {
    return this.getByCode(PostulationStatusCode.EVALUATION_EXPIRED);
  }

  /**
   * Valida si un estado existe y está activo
   * @param code - Código del estado a validar
   * @returns true si el estado existe y está activo
   */
  async isValidStatus(code: PostulationStatusCode): Promise<boolean> {
    try {
      const status = await this.getByCode(code);
      return status.isActive;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene todos los estados activos ordenados por displayOrder
   * @returns Lista de estados activos
   */
  async getAllActiveStatuses(): Promise<PostulationStatus[]> {
    return this.postulationStatusRepository.findAllActive();
  }

  /**
   * Obtiene todos los estados de postulación
   * @returns Lista de estados de postulación
   */
  async getAllStatuses(): Promise<PostulationStatusResponseDto[]> {
    const statuses: PostulationStatus[] =
      await this.postulationStatusRepository.findAll();

    return statuses.map((status) => ({
      id: status.id,
      name: status.name,
      code: status.code,
    }));
  }

  /**
   * Obtiene un estado de postulación por su ID
   * @param id - ID del estado
   * @returns Estado de postulación o null si no existe
   */
  async findById(id: number): Promise<PostulationStatus | null> {
    return await this.postulationStatusRepository.findById(id);
  }

  /**
   * Obtiene un estado de postulación por su código
   * @param code - Código del estado
   * @returns Estado de postulación o null si no existe
   */
  async findByCode(
    code: PostulationStatusCode,
  ): Promise<PostulationStatus | null> {
    return await this.postulationStatusRepository.findByCode(code);
  }
}
