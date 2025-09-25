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
    const availableActionsMap = new Map<number, string[]>();
    hirings.forEach((hiring) => {
      const actions = this.operationsService.getAvailableActions(hiring);
      availableActionsMap.set(hiring.id, actions);
    });

    return this.transformService.transformToListResponse(
      hirings,
      total,
      params,
      availableActionsMap,
    );
  }
}
