import { Injectable } from '@nestjs/common';
import { ServiceHiring } from '../entities/service-hiring.entity';
import { ServiceHiringContext } from '../states/service-hiring-context';
import { ServiceHiringStateFactory } from '../states/service-hiring-state.factory';
import { QuotationExpirationService } from './quotation-expiration.service';

@Injectable()
export class ServiceHiringOperationsService {
  constructor(
    private readonly stateFactory: ServiceHiringStateFactory,
    private readonly quotationExpirationService: QuotationExpirationService,
  ) {}

  getHiringContext(hiring: ServiceHiring): ServiceHiringContext {
    const state = this.stateFactory.createState(hiring);
    return new ServiceHiringContext(hiring, state);
  }

  async canPerformAction(
    hiring: ServiceHiring,
    action: string,
  ): Promise<boolean> {
    // Solo verificar expiración para estados donde la cotización puede vencer
    const quotationStatuses = ['pending', 'quoted', 'negotiating'];
    if (quotationStatuses.includes(hiring.status.code)) {
      const isExpired =
        await this.quotationExpirationService.isQuotationExpired(hiring.id);

      // Si está vencida, solo se puede ver (no permitir acciones)
      if (
        isExpired &&
        ['accept', 'reject', 'edit', 'negotiate'].includes(action)
      ) {
        return false;
      }
    }

    const context = this.getHiringContext(hiring);

    switch (action) {
      case 'quote':
        return context.canQuote();
      case 'accept':
        return context.canAccept();
      case 'reject':
        return context.canReject();
      case 'cancel':
        return context.canCancel();
      case 'negotiate':
        return context.canNegotiate();
      case 'edit':
        return context.canEdit();
      default:
        return false;
    }
  }

  async getAvailableActions(hiring: ServiceHiring): Promise<string[]> {
    const context = this.getHiringContext(hiring);
    const stateActions = context.getAvailableActions();

    // Estados finales no tienen acciones, incluso si están vencidos
    const finalStatuses = [
      'rejected',
      'completed',
      'cancelled',
      'completed_by_claim',
      'cancelled_by_claim',
      'completed_with_agreement',
    ];
    if (finalStatuses.includes(hiring.status.code)) {
      return []; // Sin acciones para estados finales
    }

    // Solo verificar expiración para estados donde la cotización puede vencer
    const quotationStatuses = ['pending', 'quoted', 'negotiating'];
    if (quotationStatuses.includes(hiring.status.code)) {
      const isExpired =
        await this.quotationExpirationService.isQuotationExpired(hiring.id);

      // Si está vencida, solo se puede ver
      if (isExpired) {
        return ['view'];
      }
    }

    return stateActions;
  }
}
