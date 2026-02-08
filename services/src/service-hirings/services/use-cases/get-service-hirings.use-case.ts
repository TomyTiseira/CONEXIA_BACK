import { Injectable } from '@nestjs/common';
import { GetServiceHiringsDto } from '../../dto';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';
import { ServiceHiringOperationsService } from '../service-hiring-operations.service';
import { ServiceHiringTransformService } from '../service-hiring-transform.service';

@Injectable()
export class GetServiceHiringsUseCase {
  constructor(
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly operationsService: ServiceHiringOperationsService,
    private readonly transformService: ServiceHiringTransformService,
  ) {}

  async execute(params: GetServiceHiringsDto) {
    const { data: hirings, total } =
      await this.hiringRepository.findWithPagination(params);

    // Obtener acciones disponibles para cada contratación
    const availableActionsMap = new Map<number, string[]>();
    for (const hiring of hirings) {
      const actions = await this.operationsService.getAvailableActions(hiring);
      availableActionsMap.set(hiring.id, actions);
    }

    return this.transformService.transformToListResponse(
      hirings,
      total,
      params,
      availableActionsMap,
    );
  }
}
