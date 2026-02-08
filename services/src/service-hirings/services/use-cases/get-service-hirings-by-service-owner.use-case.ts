import { Injectable } from '@nestjs/common';
import { UsersClientService } from '../../../common/services/users-client.service';
import { GetServiceHiringsDto } from '../../dto';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';
import { ServiceHiringOperationsService } from '../service-hiring-operations.service';
import { ServiceHiringTransformService } from '../service-hiring-transform.service';

@Injectable()
export class GetServiceHiringsByServiceOwnerUseCase {
  constructor(
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly operationsService: ServiceHiringOperationsService,
    private readonly transformService: ServiceHiringTransformService,
    private readonly usersClientService: UsersClientService,
  ) {}

  async execute(serviceOwnerId: number, params: GetServiceHiringsDto) {
    const { data: hirings, total } =
      await this.hiringRepository.findByServiceOwner(serviceOwnerId, params);

    // Obtener IDs únicos de usuarios
    const userIds = [...new Set(hirings.map((hiring) => hiring.userId))];

    // Obtener información de usuarios
    const users = await this.usersClientService.getUsersByIds(userIds);
    const usersMap = new Map(users.map((user) => [user.id, user]));

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
      usersMap,
    );
  }
}
