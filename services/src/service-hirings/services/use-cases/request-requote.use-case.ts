import { Injectable, Logger } from '@nestjs/common';
import {
  InvalidStatusForRequoteException,
  OnlyClientCanRequestRequoteException,
  QuotationNotExpiredException,
  RequoteLimitReachedException,
  ServiceHiringNotFoundException,
  UserBannedOrDeletedRequoteException,
} from '../../../common/exceptions';
import { EmailService } from '../../../common/services/email.service';
import { UsersClientService } from '../../../common/services/users-client.service';
import { ServiceHiringStatusCode } from '../../enums/service-hiring-status.enum';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';
import { QuotationExpirationService } from '../quotation-expiration.service';
import { ServiceHiringStatusService } from '../service-hiring-status.service';

@Injectable()
export class RequestRequoteUseCase {
  private readonly logger = new Logger(RequestRequoteUseCase.name);
  private readonly REQUOTE_LIMIT = 3; // Límite de re-cotizaciones

  constructor(
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly statusService: ServiceHiringStatusService,
    private readonly quotationExpirationService: QuotationExpirationService,
    private readonly emailService: EmailService,
    private readonly usersClient: UsersClientService,
  ) {}

  async execute(hiringId: number, userId: number) {
    // 1. Obtener la contratación con todas las relaciones necesarias
    const hiring = await this.hiringRepository.findById(hiringId);
    if (!hiring) {
      throw new ServiceHiringNotFoundException(hiringId);
    }

    // 2. Validar que el usuario es el cliente
    if (hiring.userId !== userId) {
      throw new OnlyClientCanRequestRequoteException();
    }

    // 3. Validar que el estado actual es 'quoted'
    if (hiring.status.code !== ServiceHiringStatusCode.QUOTED) {
      throw new InvalidStatusForRequoteException(hiring.status.code);
    }

    // 4. Validar que la cotización está vencida
    const isExpired = await this.quotationExpirationService.isQuotationExpired(
      hiring.id,
    );
    if (!isExpired) {
      throw new QuotationNotExpiredException();
    }

    // 5. Obtener información del cliente
    const client = await this.usersClient.getUserById(userId);
    if (!client) {
      throw new UserBannedOrDeletedRequoteException('client');
    }

    // 6. Validar que el cliente no esté baneado o dado de baja
    if (client.isBanned || client.deletedAt) {
      throw new UserBannedOrDeletedRequoteException('client');
    }

    // 7. Obtener información del proveedor
    const provider = await this.usersClient.getUserById(hiring.service.userId);
    if (!provider) {
      throw new UserBannedOrDeletedRequoteException('provider');
    }

    // 8. Validar que el proveedor no esté baneado o dado de baja
    if (provider.isBanned || provider.deletedAt) {
      throw new UserBannedOrDeletedRequoteException('provider');
    }

    // 9. Validar límite de re-cotizaciones (opcional)
    const currentRequoteCount = hiring.requoteCount || 0;
    if (currentRequoteCount >= this.REQUOTE_LIMIT) {
      throw new RequoteLimitReachedException(this.REQUOTE_LIMIT);
    }

    // 10. Obtener el estado "requoting"
    const requotingStatus = await this.statusService.getStatusByCode(
      ServiceHiringStatusCode.REQUOTING,
    );

    // 11. Guardar datos de la cotización anterior
    const updateData = {
      statusId: requotingStatus.id,
      requoteRequestedAt: new Date(),
      previousQuotedPrice: hiring.quotedPrice,
      previousQuotedAt: hiring.quotedAt,
      previousQuotationValidityDays: hiring.quotationValidityDays,
      requoteCount: currentRequoteCount + 1,
    };

    // 12. Actualizar la contratación
    const updatedHiring = await this.hiringRepository.update(
      hiring.id,
      updateData,
    );

    if (!updatedHiring) {
      throw new Error('Error al solicitar re-cotización');
    }

    // 13. Enviar notificación por email al proveedor
    this.sendRequoteNotification(updatedHiring, client, provider);

    // 14. Log de la operación
    this.logger.log(
      `Re-cotización solicitada - Hiring: ${hiringId}, Cliente: ${userId}, Proveedor: ${provider.id}`,
    );

    // 15. Retornar datos relevantes
    return {
      id: updatedHiring.id,
      status: updatedHiring.status.code,
      requoteRequestedAt: updatedHiring.requoteRequestedAt,
      isExpired: false,
      requoteCount: updatedHiring.requoteCount,
      previousQuotedPrice: updatedHiring.previousQuotedPrice,
      previousQuotedAt: updatedHiring.previousQuotedAt,
      previousQuotationValidityDays:
        updatedHiring.previousQuotationValidityDays,
    };
  }

  private sendRequoteNotification(
    hiring: any,
    client: any,
    provider: any,
  ): void {
    try {
      // Enviar email al proveedor
      if (provider.email) {
        // TODO: Implementar método sendRequoteRequestedEmail en EmailService
        // await this.emailService.sendRequoteRequestedEmail(
        //   provider.email,
        //   providerName,
        //   notificationData,
        // );
        this.logger.log(
          `Email de re-cotización pendiente de implementar para ${provider.email}`,
        );
      }

      this.logger.log(
        `Notificación de re-cotización enviada al proveedor ${provider.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error al enviar notificación de re-cotización: ${error.message}`,
      );
      // No lanzamos el error para no bloquear la operación principal
    }
  }
}
