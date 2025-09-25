import { Injectable } from '@nestjs/common';
import { ServiceHiringStatusCode } from '../enums/service-hiring-status.enum';
import { ServiceHiringStatusRepository } from '../repositories/service-hiring-status.repository';

@Injectable()
export class ServiceHiringStatusService {
  constructor(
    private readonly statusRepository: ServiceHiringStatusRepository,
  ) {}

  async getStatusByCode(code: ServiceHiringStatusCode) {
    const status = await this.statusRepository.findByCode(code);
    if (!status) {
      throw new Error(`Status with code ${code} not found`);
    }
    return status;
  }

  async getAllStatuses() {
    return this.statusRepository.findAll();
  }
}
