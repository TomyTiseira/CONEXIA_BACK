import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetServicesDto } from '../dto/get-services.dto';
import { Service } from '../entities/service.entity';

@Injectable()
export class ServiceRepository {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(data: Partial<Service>): Promise<Service> {
    const service = this.serviceRepository.create(data);
    return this.serviceRepository.save(service);
  }

  async findById(id: number): Promise<Service | null> {
    return this.serviceRepository.findOne({ where: { id } });
  }

  async findAll(getServicesDto: GetServicesDto): Promise<[Service[], number]> {
    const { page = 1, limit = 10, search, status, userId } = getServicesDto;
    const offset = (page - 1) * limit;

    const queryBuilder = this.serviceRepository.createQueryBuilder('service');

    if (search) {
      queryBuilder.andWhere(
        '(service.name ILIKE :search OR service.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('service.status = :status', { status });
    }

    if (userId) {
      queryBuilder.andWhere('service.userId = :userId', { userId });
    }

    queryBuilder.orderBy('service.createdAt', 'DESC').skip(offset).take(limit);

    return queryBuilder.getManyAndCount();
  }

  async update(id: number, data: Partial<Service>): Promise<void> {
    await this.serviceRepository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.serviceRepository.delete(id);
  }

  async findByUserId(
    userId: number,
    getServicesDto: GetServicesDto,
  ): Promise<[Service[], number]> {
    return this.findAll({ ...getServicesDto, userId });
  }
}
