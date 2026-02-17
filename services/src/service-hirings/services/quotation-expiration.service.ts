import { Injectable } from '@nestjs/common';
import { ServiceHiringStatusCode } from '../enums/service-hiring-status.enum';
import { ServiceHiringRepository } from '../repositories/service-hiring.repository';
import { ServiceHiringStatusService } from './service-hiring-status.service';

@Injectable()
export class QuotationExpirationService {
  constructor(
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly statusService: ServiceHiringStatusService,
  ) {}

  async checkExpiredQuotations() {
    try {
      // Obtener el estado "expired"
      const expiredStatus = await this.statusService.getStatusByCode(
        ServiceHiringStatusCode.EXPIRED,
      );

      // Ejecutar la actualización directamente en la base de datos
      const result = await this.hiringRepository.markExpiredQuotations(
        expiredStatus.id,
      );

      return result;
    } catch (error) {
      console.error('Error checking expired quotations:', error);
      return 0;
    }
  }

  async isQuotationExpired(hiringId: number): Promise<boolean> {
    const hiring = await this.hiringRepository.findById(hiringId);

    if (!hiring || !hiring.quotedAt || !hiring.quotationValidityDays) {
      return false;
    }

    const expirationDate = new Date(hiring.quotedAt);
    expirationDate.setDate(
      expirationDate.getDate() + hiring.quotationValidityDays,
    );

    return new Date() > expirationDate;
  }
}
