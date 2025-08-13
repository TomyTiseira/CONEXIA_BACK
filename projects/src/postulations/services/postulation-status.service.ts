import { Injectable } from '@nestjs/common';
import { PostulationStatusNotFoundException } from '../../common/exceptions/postulation.exceptions';
import { PostulationStatus } from '../entities/postulation-status.entity';
import { PostulationStatusCode } from '../enums/postulation-status.enum';
import { PostulationStatusRepository } from '../repositories/postulation-status.repository';

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
}
