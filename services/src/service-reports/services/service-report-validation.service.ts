import { Injectable } from '@nestjs/common';
import {
  ServiceAlreadyReportedException,
  ServiceDeletedException,
  ServiceNotActiveException,
  ServiceOwnerCannotReportException,
  ServiceReportBadRequestException,
} from '../../common/exceptions/service-report.exceptions';
import { ServiceNotFoundException } from '../../common/exceptions/services.exceptions';
import { ServiceRepository } from '../../services/repositories/service.repository';
import { ServiceReportReason } from '../enums/service-report-reason.enum';
import { ServiceReportRepository } from '../repositories/service-report.repository';

@Injectable()
export class ServiceReportValidationService {
  constructor(
    private readonly serviceReportRepository: ServiceReportRepository,
    private readonly serviceRepository: ServiceRepository,
  ) {}

  /**
   * Valida que el servicio existe y está activo
   * @param serviceId - ID del servicio
   */
  async validateServiceExistsAndActive(serviceId: number): Promise<void> {
    const service =
      await this.serviceRepository.findByIdWithRelations(serviceId);

    if (!service) {
      throw new ServiceNotFoundException(serviceId);
    }

    if (service.deletedAt !== null) {
      throw new ServiceDeletedException(serviceId);
    }

    if (service.status !== 'active') {
      throw new ServiceNotActiveException(serviceId);
    }
  }

  /**
   * Valida que el usuario no haya reportado ya el servicio
   * @param serviceId - ID del servicio
   * @param reporterId - ID del usuario que reporta
   */
  async validateUserNotAlreadyReported(
    serviceId: number,
    reporterId: number,
  ): Promise<void> {
    const existingReport =
      await this.serviceReportRepository.findByServiceAndReporter(
        serviceId,
        reporterId,
      );

    if (existingReport) {
      throw new ServiceAlreadyReportedException(serviceId);
    }
  }

  /**
   * Valida que el usuario no sea el dueño del servicio
   * @param serviceId - ID del servicio
   * @param reporterId - ID del usuario que reporta
   */
  async validateUserNotServiceOwner(
    serviceId: number,
    reporterId: number,
  ): Promise<void> {
    const service =
      await this.serviceRepository.findByIdWithRelations(serviceId);

    if (!service) {
      throw new ServiceNotFoundException(serviceId);
    }

    if (service.userId === reporterId) {
      throw new ServiceOwnerCannotReportException(serviceId);
    }
  }

  /**
   * Valida el motivo del reporte
   * @param reason - Motivo del reporte
   * @param otherReason - Motivo personalizado si se selecciona "Otro"
   */
  validateReportReason(
    reason: ServiceReportReason,
    otherReason?: string,
  ): void {
    if (reason === ServiceReportReason.OTHER && !otherReason) {
      throw new ServiceReportBadRequestException(
        'Debes proporcionar una descripción cuando seleccionas "Otro"',
      );
    }
  }
}
