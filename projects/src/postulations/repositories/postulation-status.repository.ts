import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostulationStatus } from '../entities/postulation-status.entity';
import { PostulationStatusCode } from '../enums/postulation-status.enum';

@Injectable()
export class PostulationStatusRepository {
  constructor(
    @InjectRepository(PostulationStatus)
    private readonly postulationStatusRepository: Repository<PostulationStatus>,
  ) {}

  async findByCode(
    code: PostulationStatusCode,
  ): Promise<PostulationStatus | null> {
    return await this.postulationStatusRepository.findOne({
      where: { code, isActive: true },
    });
  }

  async findById(id: number): Promise<PostulationStatus | null> {
    return await this.postulationStatusRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async findAllActive(): Promise<PostulationStatus[]> {
    return await this.postulationStatusRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });
  }

  async findActiveStatus(): Promise<PostulationStatus | null> {
    return await this.postulationStatusRepository.findOne({
      where: { code: PostulationStatusCode.ACTIVE, isActive: true },
    });
  }
}
