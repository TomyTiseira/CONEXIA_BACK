import { Injectable } from '@nestjs/common';
import { UsersClientService } from '../../../common/services/users-client.service';
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
    private readonly usersClientService: UsersClientService,
  ) {}

  async execute(userId: number, params: GetServiceHiringsDto) {
    const paramsWithUserId = { ...params, userId };
    const { data: serviceHirings, total } =
      await this.hiringRepository.findWithPagination(paramsWithUserId);

    // Obtener acciones disponibles para cada contratación
    const availableActionsMap = new Map<number, string[]>();
    for (const hiring of serviceHirings) {
      const actions = await this.operationsService.getAvailableActions(hiring);
      availableActionsMap.set(hiring.id, actions);
    }

    // Obtener información de los dueños de los servicios
    const ownerIds = serviceHirings
      .map((h) => h.service?.userId)
      .filter(Boolean);
    const owners = await this.usersClientService.getUsersByIds(ownerIds);
    const ownersMap = new Map(owners.map((o) => [o.id, o]));

    return this.transformService.transformToListResponse(
      serviceHirings,
      total,
      params,
      availableActionsMap,
      undefined, // usersMap - no lo necesitamos aquí
      ownersMap, // ownersMap - va como sexto parámetro
    );
  }
}
