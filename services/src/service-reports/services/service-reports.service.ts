import { Injectable } from '@nestjs/common';
import { ServiceReportInternalServerErrorException } from '../../common/exceptions/service-report.exceptions';
import { UsersClientService } from '../../common/services/users-client.service';
import { CreateServiceReportDto } from '../dtos/create-service-report.dto';
import { ServiceReport } from '../entities/service-report.entity';
import { ServiceReportRepository } from '../repositories/service-report.repository';
import { ServiceReportValidationService } from './service-report-validation.service';

@Injectable()
export class ServiceReportsService {
  constructor(
    private readonly serviceReportRepository: ServiceReportRepository,
    private readonly serviceReportValidationService: ServiceReportValidationService,
    private readonly usersClientService: UsersClientService,
  ) {}

  /**
   * Crea un nuevo reporte de servicio
   * @param createServiceReportDto - Datos del reporte
   * @param userId - ID del usuario que reporta
   * @returns El reporte creado
   */
  async createReport(
    createServiceReportDto: CreateServiceReportDto,
    userId: number,
  ): Promise<ServiceReport> {
    // Validar que el servicio existe y está activo
    await this.serviceReportValidationService.validateServiceExistsAndActive(
      createServiceReportDto.serviceId,
    );

    // Validar que el usuario no sea el dueño del servicio
    await this.serviceReportValidationService.validateUserNotServiceOwner(
      createServiceReportDto.serviceId,
      userId,
    );

    // Validar que el usuario no haya reportado ya el servicio
    await this.serviceReportValidationService.validateUserNotAlreadyReported(
      createServiceReportDto.serviceId,
      userId,
    );

    // Validar el motivo del reporte
    this.serviceReportValidationService.validateReportReason(
      createServiceReportDto.reason,
      createServiceReportDto.otherReason,
    );

    // Crear el reporte
    const report = await this.serviceReportRepository.create({
      ...createServiceReportDto,
      reporterId: userId,
    });

    return report;
  }

  /**
   * Obtiene todos los reportes de un servicio específico
   * @param serviceId - ID del servicio
   * @param page - Página actual
   * @param limit - Límite de elementos por página
   * @returns Lista de reportes con información del usuario
   */
  async getServiceReports(
    serviceId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<[ServiceReport[], number]> {
    try {
      return this.serviceReportRepository.findReportsByService(
        serviceId,
        page,
        limit,
      );
    } catch (error) {
      throw new ServiceReportInternalServerErrorException(
        'Error interno al obtener los reportes del servicio',
      );
    }
  }

  /**
   * Obtiene servicios con conteo de reportes
   * @param orderBy - Criterio de ordenamiento
   * @param page - Página actual
   * @param limit - Límite de elementos por página
   * @returns Lista de servicios con conteo de reportes
   */
  async getServicesWithReportCounts(
    orderBy: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<[any[], number]> {
    try {
      return this.serviceReportRepository.getServicesWithReportCounts(
        orderBy as any,
        page,
        limit,
      );
    } catch (error) {
      throw new ServiceReportInternalServerErrorException(
        'Error interno al obtener los servicios con reportes',
      );
    }
  }

  /**
   * Obtiene el conteo de reportes de un servicio
   * @param serviceId - ID del servicio
   * @returns Número de reportes
   */
  async getReportCountByService(serviceId: number): Promise<number> {
    try {
      return this.serviceReportRepository.getReportCountByService(serviceId);
    } catch (error) {
      throw new ServiceReportInternalServerErrorException(
        'Error interno al obtener el conteo de reportes del servicio',
      );
    }
  }

  /**
   * Elimina todos los reportes de un servicio
   * @param serviceId - ID del servicio
   */
  async deleteReportsByService(serviceId: number): Promise<void> {
    try {
      await this.serviceReportRepository.deleteByService(serviceId);
    } catch (error) {
      throw new ServiceReportInternalServerErrorException(
        'Error interno al eliminar los reportes del servicio',
      );
    }
  }

  /**
   * Obtiene todos los reportes activos con información del servicio
   * @returns Lista de reportes activos con datos necesarios para moderación
   */
  async getActiveReports() {
    const reports =
      await this.serviceReportRepository.findActiveReportsWithServices();
    return reports.map((report) => ({
      id: report.id,
      reporterId: report.reporterId,
      reason: report.reason,
      otherReason: report.otherReason,
      description: report.description,
      createdAt: report.createdAt,
      isActive: report.isActive,
      updatedAt: report.updatedAt,
      reportedUserId: report.service?.userId || null,
      serviceId: report.serviceId,
    }));
  }

  /**
   * Marca como inactivos reportes anteriores a una fecha
   */
  async softDeleteOldReports(oneYearAgo: Date) {
    return await this.serviceReportRepository.softDeleteOldReports(oneYearAgo);
  }

  /**
   * Desactiva reportes específicos por ID
   */
  async deactivateReports(reportIds: number[]) {
    return await this.serviceReportRepository.deactivateReports(reportIds);
  }
}
