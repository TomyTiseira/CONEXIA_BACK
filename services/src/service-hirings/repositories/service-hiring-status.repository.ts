import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceHiringStatus } from '../entities/service-hiring-status.entity';
import { ServiceHiringStatusCode } from '../enums/service-hiring-status.enum';

@Injectable()
export class ServiceHiringStatusRepository {
  constructor(
    @InjectRepository(ServiceHiringStatus)
    private readonly repository: Repository<ServiceHiringStatus>,
  ) {}

  async findByCode(
    code: ServiceHiringStatusCode,
  ): Promise<ServiceHiringStatus | null> {
    return this.repository.findOne({ where: { code } });
  }

  async findAll(): Promise<ServiceHiringStatus[]> {
    return this.repository.find({ where: { isActive: true } });
  }

  async findById(id: number): Promise<ServiceHiringStatus | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(
    statusData: Partial<ServiceHiringStatus>,
  ): Promise<ServiceHiringStatus> {
    const status = this.repository.create(statusData);
    return this.repository.save(status);
  }
}
