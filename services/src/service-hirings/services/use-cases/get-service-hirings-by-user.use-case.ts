import { Injectable } from '@nestjs/common';
import { GetServiceHiringsDto } from '../../dto';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';
import { ServiceHiringOperationsService } from '../service-hiring-operations.service';
import { ServiceHiringTransformService } from '../service-hiring-transform.service';

@Injectable()
export class GetServiceHiringsByUserUseCase {
  constructor(
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly operationsService: ServiceHiringOperationsService,
    private readonly transformService: ServiceHiringTransformService,
  ) {}

  async execute(userId: number, params: GetServiceHiringsDto) {
    const paramsWithUserId = { ...params, userId };
    const { data: hirings, total } =
      await this.hiringRepository.findWithPagination(paramsWithUserId);

    // Obtener acciones disponibles para cada contratación
    // Filtrar acciones sensibles por rol (ej. 'start_service' solo para el owner del servicio)
    const availableActionsMap = new Map<number, string[]>();
    for (const hiring of hirings) {
      const actions = await this.operationsService.getAvailableActions(hiring);
      // Si la acción 'start_service' existe, solo debe mostrarse al owner del servicio
      const filteredActions = actions.filter((a) => {
        if (a === 'start_service') {
          return hiring.service?.userId === userId;
        }
        return true;
      });

      availableActionsMap.set(hiring.id, filteredActions);
    }

    return this.transformService.transformToListResponse(
      hirings,
      total,
      params,
      availableActionsMap,
    );
  }
}
