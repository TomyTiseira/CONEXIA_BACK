import { Injectable } from '@nestjs/common';
import { ServiceNotFoundException } from '../../../common/exceptions/services.exceptions';
import { UsersClientService } from '../../../common/services/users-client.service';
import { transformServicesWithOwners } from '../../../common/utils/service-transform.utils';
import { DeliverableRepository } from '../../../service-hirings/repositories/deliverable.repository';
import { ServiceHiringRepository } from '../../../service-hirings/repositories/service-hiring.repository';
import { ServiceReportRepository } from '../../../service-reports/repositories/service-report.repository';
import { GetServiceByIdDto } from '../../dto/get-service-by-id.dto';
import { ServiceRepository } from '../../repositories/service.repository';

@Injectable()
export class GetServiceByIdUseCase {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly usersClientService: UsersClientService,
    private readonly serviceHiringRepository: ServiceHiringRepository,
    private readonly deliverableRepository: DeliverableRepository,
    private readonly serviceReportRepository: ServiceReportRepository,
  ) {}

  async execute(data: GetServiceByIdDto) {
    // Buscar el servicio con relaciones
    const service = await this.serviceRepository.findByIdWithRelations(data.id);

    if (!service) {
      throw new ServiceNotFoundException(data.id);
    }

    // Obtener información del dueño del servicio
    let users = await this.usersClientService.getUsersByIds([service.userId]);

    // Si no se encuentra el usuario, usar valores por defecto
    if (!users || users.length === 0) {
      const defaultUser = {
        id: service.userId,
        firstName: '',
        lastName: '',
        email: '',
        profile: null,
      };
      users = [defaultUser];
    }

    // Obtener información de cotizaciones para el servicio
    const quotationInfo =
      await this.serviceHiringRepository.getQuotationInfoForServices(
        [service.id],
        data.currentUserId,
      );

    // Obtener la cotización activa (service_hirings) para el usuario y el servicio
    const serviceHiring =
      await this.serviceHiringRepository.findAnyHiringByUserAndService(
        data.currentUserId,
        service.id,
      );

    // Si existe una contratación activa, obtener los entregables y transformarlos igual que en las solicitudes
    let deliverables: any[] | null = null;
    if (serviceHiring) {
      const rawDeliverables = await this.deliverableRepository.findByHiringId(
        serviceHiring.id,
      );

      deliverables =
        rawDeliverables.length > 0
          ? rawDeliverables.map((d) => ({
              id: d.id,
              hiringId: d.hiringId,
              title: d.title,
              description: d.description,
              estimatedDeliveryDate: d.estimatedDeliveryDate,
              price: d.price,
              orderIndex: d.orderIndex,
              status: d.status,
              deliveredAt: d.deliveredAt,
              approvedAt: d.approvedAt,
              createdAt: d.createdAt,
              updatedAt: d.updatedAt,
            }))
          : null;
    }

    // Transformar el servicio usando la función común
    const transformedServices = transformServicesWithOwners(
      [service],
      users,
      data.currentUserId,
      quotationInfo,
    );

    // Verificar si el usuario actual ya reportó este servicio
    let hasReported = false;
    if (data.currentUserId && data.currentUserId !== service.userId) {
      const existingReport = await this.serviceReportRepository.findByServiceAndReporter(
        service.id,
        data.currentUserId,
      );
      hasReported = existingReport !== null;
    }

    // Retornar el primer (y único) servicio transformado junto con la cotización activa, entregables y estado de reporte
    const result = {
      ...transformedServices[0],
      serviceHiring,
      deliverables,
      hasReported,
    };

    return result;
  }
}
