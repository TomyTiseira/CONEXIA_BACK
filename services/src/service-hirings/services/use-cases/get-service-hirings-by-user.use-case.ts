import { Injectable } from '@nestjs/common';
import { GetServiceHiringsDto } from '../../dto';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';
import { ServiceHiringOperationsService } from '../service-hiring-operations.service';
import { ServiceHiringTransformService } from '../service-hiring-transform.service';
import { UsersClientService } from '../../../common/services/users-client.service';

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
    const { data: hirings, total } =
      await this.hiringRepository.findWithPagination(paramsWithUserId);

    // Obtener acciones disponibles para cada contratación
    const availableActionsMap = new Map<number, string[]>();
    for (const hiring of hirings) {
      const actions = await this.operationsService.getAvailableActions(hiring);
      availableActionsMap.set(hiring.id, actions);
    }

    // Obtener información de los dueños de los servicios
    const ownerIds = hirings.map(h => h.service?.userId).filter(Boolean);
    const owners = await this.usersClientService.getUsersByIds(ownerIds);
    const ownersMap = new Map(owners.map(o => [o.id, o]));

    // Enriquecer cada hiring con datos del dueño
    const hiringsWithOwner = hirings.map(hiring => ({
      ...hiring,
      owner: ownersMap.get(hiring.service?.userId) || null,
    }));

    return this.transformService.transformToListResponse(
      hiringsWithOwner,
      total,
      params,
      availableActionsMap,
    );
  }
}
