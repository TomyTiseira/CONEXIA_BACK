import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ServiceHiringStatus } from '../../service-hirings/entities/service-hiring-status.entity';
import { ServiceHiring } from '../../service-hirings/entities/service-hiring.entity';
import { ServiceHiringStatusCode } from '../../service-hirings/enums/service-hiring-status.enum';
import { Service } from '../../services/entities/service.entity';
import { EmailService } from './email.service';
import { UsersClientService } from './users-client.service';

@Injectable()
export class ModerationListenerService {
  private readonly logger = new Logger(ModerationListenerService.name);

  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(ServiceHiring)
    private readonly serviceHiringRepository: Repository<ServiceHiring>,
    @InjectRepository(ServiceHiringStatus)
    private readonly serviceHiringStatusRepository: Repository<ServiceHiringStatus>,
    private readonly emailService: EmailService,
    private readonly usersClientService: UsersClientService,
  ) {}

  /**
   * Maneja el evento cuando un usuario es baneado
   */
  async handleUserBanned(userId: number): Promise<void> {
    this.logger.log(`Procesando baneo de usuario ${userId}`);

    try {
      // 1. Actualizar ownerModerationStatus y ocultar servicios
      const hiddenServices = await this.hideUserServices(userId, 'banned');
      this.logger.log(`${hiddenServices} servicios marcados como owner baneado (userId=${userId})`);

      // 2. Terminar servicios activos donde el usuario es proveedor
      const terminatedAsProvider = await this.terminateActiveHirings(userId);
      this.logger.log(`${terminatedAsProvider} contrataciones terminadas donde usuario es proveedor`);

      // 3. Terminar servicios activos donde el usuario es cliente
      const terminatedAsClient = await this.terminateActiveHiringsAsClient(userId);
      this.logger.log(`${terminatedAsClient} contrataciones terminadas donde usuario es cliente`);

      this.logger.log(`Baneo completado para usuario ${userId}`);
    } catch (error) {
      this.logger.error(`Error procesando baneo de usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Maneja el evento cuando un usuario es suspendido
   */
  async handleUserSuspended(userId: number): Promise<void> {
    this.logger.log(`Procesando suspensión de usuario ${userId}`);

    try {
      // 1. Actualizar ownerModerationStatus (servicios quedan activos pero con flag)
      const updatedServices = await this.markUserServicesAsSuspended(userId);
      this.logger.log(`${updatedServices} servicios marcados como owner suspendido (userId=${userId})`);

      // Los servicios en curso se mantienen activos para que pueda completarlos

      this.logger.log(`Suspensión procesada para usuario ${userId}`);
    } catch (error) {
      this.logger.error(`Error procesando suspensión de usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Maneja el evento cuando un usuario es reactivado
   */
  async handleUserReactivated(userId: number): Promise<void> {
    this.logger.log(`Procesando reactivación de usuario ${userId}`);

    try {
      // 1. Limpiar ownerModerationStatus y restaurar visibilidad
      const restoredServices = await this.restoreUserServices(userId);
      this.logger.log(`${restoredServices} servicios restaurados para usuario ${userId}`);

      this.logger.log(`Reactivación completada para usuario ${userId}`);
    } catch (error) {
      this.logger.error(`Error procesando reactivación de usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Marca servicios con ownerModerationStatus cuando el owner es baneado
   */
  private async hideUserServices(userId: number, moderationStatus: 'banned'): Promise<number> {
    const result = await this.serviceRepository.update(
      {
        userId,
        deletedAt: IsNull(),
      },
      {
        status: 'finished_by_moderation',
        hiddenByModeration: true,
        moderationReason: 'Usuario baneado por violaciones graves',
        moderationUpdatedAt: new Date(),
        ownerModerationStatus: moderationStatus,
      },
    );

    return result.affected || 0;
  }

  /**
   * Marca servicios con ownerModerationStatus = 'suspended' (sin cambiar status)
   */
  private async markUserServicesAsSuspended(userId: number): Promise<number> {
    const result = await this.serviceRepository.update(
      {
        userId,
        deletedAt: IsNull(),
      },
      {
        ownerModerationStatus: 'suspended',
        moderationReason: 'Proveedor suspendido temporalmente',
        moderationUpdatedAt: new Date(),
      },
    );

    return result.affected || 0;
  }

  /**
   * Restaura la visibilidad de los servicios de un usuario y limpia ownerModerationStatus
   * Solo restaura servicios con estado 'suspended', NO los baneados (permanentes)
   */
  private async restoreUserServices(userId: number): Promise<number> {
    const result = await this.serviceRepository.update(
      {
        userId,
        deletedAt: IsNull(),
        ownerModerationStatus: 'suspended', // Solo restaurar suspendidos, NO baneados
      },
      {
        status: 'active', // Volver a activo
        hiddenByModeration: false,
        moderationReason: null,
        moderationUpdatedAt: new Date(),
        ownerModerationStatus: null, // Limpiar el flag
      },
    );

    return result.affected || 0;
  }

  /**
   * Termina TODAS las contrataciones donde el usuario es proveedor (no solo activas)
   * Según user story: TODAS deben pasar a terminated_by_moderation al banear
   */
  private async terminateActiveHirings(userId: number): Promise<number> {
    // Obtener el status de "terminated_by_moderation"
    const terminatedStatus = await this.serviceHiringStatusRepository.findOne({
      where: { code: ServiceHiringStatusCode.TERMINATED_BY_MODERATION },
    });

    if (!terminatedStatus) {
      this.logger.error('Estado "terminated_by_moderation" no encontrado en la base de datos');
      return 0;
    }

    // Buscar todos los servicios del proveedor
    const providerServices = await this.serviceRepository.find({
      where: { userId },
      select: ['id', 'title'],
    });

    if (providerServices.length === 0) {
      return 0;
    }

    const serviceIds = providerServices.map((s) => s.id);

    // Estados que NO deben ser cambiados (ya están finalizados)
    const finalStatusCodes = [
      ServiceHiringStatusCode.COMPLETED,
      ServiceHiringStatusCode.CANCELLED,
      ServiceHiringStatusCode.REJECTED,
      ServiceHiringStatusCode.EXPIRED,
      ServiceHiringStatusCode.CANCELLED_BY_CLAIM,
      ServiceHiringStatusCode.COMPLETED_BY_CLAIM,
      ServiceHiringStatusCode.COMPLETED_WITH_AGREEMENT,
      ServiceHiringStatusCode.TERMINATED_BY_MODERATION,
      ServiceHiringStatusCode.FINISHED_BY_MODERATION,
    ];

    const finalStatuses = await this.serviceHiringStatusRepository.find({
      where: finalStatusCodes.map((code) => ({ code })),
    });

    const finalStatusIds = finalStatuses.map((s) => s.id);

    // Obtener contrataciones NO finalizadas ANTES de terminarlas para enviar emails
    const activeHirings = await this.serviceHiringRepository
      .createQueryBuilder('hiring')
      .leftJoinAndSelect('hiring.service', 'service')
      .where('hiring.service_id IN (:...serviceIds)', { serviceIds })
      .andWhere('hiring.status_id NOT IN (:...finalStatusIds)', { finalStatusIds })
      .getMany();

    if (activeHirings.length === 0) {
      return 0;
    }

    // Terminar TODAS las contrataciones no finalizadas
    const result = await this.serviceHiringRepository
      .createQueryBuilder()
      .update(ServiceHiring)
      .set({
        statusId: terminatedStatus.id,
        terminatedByModeration: true,
        terminatedReason: 'El proveedor fue baneado por violaciones graves de las políticas',
        terminatedAt: new Date(),
      })
      .where('service_id IN (:...serviceIds)', { serviceIds })
      .andWhere('status_id NOT IN (:...finalStatusIds)', { finalStatusIds })
      .execute();

    // Obtener información del proveedor baneado
    const bannedProvider = await this.usersClientService.getUserByIdWithRelations(userId);
    const providerName = bannedProvider?.profile
      ? `${bannedProvider.profile.name} ${bannedProvider.profile.lastName}`.trim()
      : 'Proveedor';

    // Enviar emails a los clientes afectados
    for (const hiring of activeHirings) {
      try {
        const client = await this.usersClientService.getUserByIdWithRelations(hiring.userId);
        if (client?.email) {
          const clientName = client?.profile
            ? `${client.profile.name} ${client.profile.lastName}`.trim()
            : 'Cliente';

          await this.emailService.sendServiceTerminatedByModerationEmail(
            client.email,
            clientName,
            {
              hiringId: hiring.id,
              serviceTitle: hiring.service?.title || 'Sin título',
              providerName,
              reason: 'El proveedor ha sido suspendido permanentemente por infracciones graves a las políticas de la plataforma.',
            },
          );

          this.logger.log(`Email de servicio terminado enviado al cliente ${client.email} (hiring #${hiring.id})`);
        }
      } catch (error) {
        this.logger.error(`Error enviando email para hiring ${hiring.id}:`, error);
      }
    }

    return result.affected || 0;
  }

  /**
   * Termina TODAS las contrataciones donde el usuario es CLIENTE (no solo activas)
   * Según user story: TODAS deben pasar a terminated_by_moderation al banear
   */
  private async terminateActiveHiringsAsClient(userId: number): Promise<number> {
    const terminatedStatus = await this.serviceHiringStatusRepository.findOne({
      where: { code: ServiceHiringStatusCode.TERMINATED_BY_MODERATION },
    });

    if (!terminatedStatus) {
      this.logger.error('Estado "terminated_by_moderation" no encontrado en la base de datos');
      return 0;
    }

    // Estados que NO deben ser cambiados (ya están finalizados)
    const finalStatusCodes = [
      ServiceHiringStatusCode.COMPLETED,
      ServiceHiringStatusCode.CANCELLED,
      ServiceHiringStatusCode.REJECTED,
      ServiceHiringStatusCode.EXPIRED,
      ServiceHiringStatusCode.CANCELLED_BY_CLAIM,
      ServiceHiringStatusCode.COMPLETED_BY_CLAIM,
      ServiceHiringStatusCode.COMPLETED_WITH_AGREEMENT,
      ServiceHiringStatusCode.TERMINATED_BY_MODERATION,
      ServiceHiringStatusCode.FINISHED_BY_MODERATION,
    ];

    const finalStatuses = await this.serviceHiringStatusRepository.find({
      where: finalStatusCodes.map((code) => ({ code })),
    });

    const finalStatusIds = finalStatuses.map((s) => s.id);

    // Obtener contrataciones NO finalizadas donde el usuario es CLIENTE (userId en hiring)
    const activeHirings = await this.serviceHiringRepository
      .createQueryBuilder('hiring')
      .leftJoinAndSelect('hiring.service', 'service')
      .where('hiring.user_id = :userId', { userId })
      .andWhere('hiring.status_id NOT IN (:...finalStatusIds)', { finalStatusIds })
      .getMany();

    if (activeHirings.length === 0) {
      return 0;
    }

    // Terminar TODAS las contrataciones no finalizadas
    const result = await this.serviceHiringRepository
      .createQueryBuilder()
      .update(ServiceHiring)
      .set({
        statusId: terminatedStatus.id,
        terminatedByModeration: true,
        terminatedReason: 'El cliente fue baneado por violaciones graves de las políticas',
        terminatedAt: new Date(),
      })
      .where('user_id = :userId', { userId })
      .andWhere('status_id NOT IN (:...finalStatusIds)', { finalStatusIds })
      .execute();

    // Obtener información del cliente baneado
    const bannedClient = await this.usersClientService.getUserByIdWithRelations(userId);
    const clientName = bannedClient?.profile
      ? `${bannedClient.profile.name} ${bannedClient.profile.lastName}`.trim()
      : 'Cliente';

    // Enviar emails a los proveedores afectados
    for (const hiring of activeHirings) {
      try {
        // Obtener información del proveedor (owner del servicio)
        const provider = await this.usersClientService.getUserByIdWithRelations(hiring.service.userId);
        if (provider?.email) {
          const providerName = provider?.profile
            ? `${provider.profile.name} ${provider.profile.lastName}`.trim()
            : 'Proveedor';

          await this.emailService.sendServiceTerminatedClientBannedEmail(
            provider.email,
            providerName,
            {
              hiringId: hiring.id,
              serviceTitle: hiring.service?.title || 'Sin título',
              clientName,
              reason: 'El cliente ha sido suspendido permanentemente por infracciones graves a las políticas de la plataforma.',
            },
          );

          this.logger.log(`Email enviado al proveedor ${provider.email} sobre hiring #${hiring.id} (cliente baneado)`);
        }
      } catch (error) {
        this.logger.error(`Error enviando email para hiring ${hiring.id}:`, error);
      }
    }

    return result.affected || 0;
  }

  /**
   * Verifica si un usuario tiene contrataciones activas como proveedor
   */
  async checkUserActiveHirings(userId: number): Promise<{
    count: number;
    details: any[];
  }> {
    // Buscar servicios del usuario
    const providerServices = await this.serviceRepository.find({
      where: { userId },
      select: ['id', 'title'],
    });

    if (providerServices.length === 0) {
      return { count: 0, details: [] };
    }

    const serviceIds = providerServices.map((s) => s.id);

    // Estados activos
    const activeStatusCodes = [
      ServiceHiringStatusCode.ACCEPTED,
      ServiceHiringStatusCode.APPROVED,
      ServiceHiringStatusCode.IN_PROGRESS,
      ServiceHiringStatusCode.DELIVERED,
      ServiceHiringStatusCode.REVISION_REQUESTED,
      ServiceHiringStatusCode.IN_CLAIM,
    ];

    const activeStatuses = await this.serviceHiringStatusRepository.find({
      where: activeStatusCodes.map((code) => ({ code })),
    });

    const activeStatusIds = activeStatuses.map((s) => s.id);

    // Buscar contrataciones activas
    const activeHirings = await this.serviceHiringRepository
      .createQueryBuilder('hiring')
      .leftJoinAndSelect('hiring.service', 'service')
      .leftJoinAndSelect('hiring.status', 'status')
      .where('hiring.service_id IN (:...serviceIds)', { serviceIds })
      .andWhere('hiring.status_id IN (:...activeStatusIds)', { activeStatusIds })
      .select([
        'hiring.id',
        'hiring.userId',
        'hiring.description',
        'service.id',
        'service.title',
        'status.id',
        'status.name',
        'status.code',
      ])
      .getMany();

    return {
      count: activeHirings.length,
      details: activeHirings.map((hiring) => ({
        hiringId: hiring.id,
        clientId: hiring.userId,
        serviceTitle: hiring.service?.title || 'Sin título',
        status: hiring.status?.name || 'Desconocido',
        description: hiring.description,
      })),
    };
  }
}
