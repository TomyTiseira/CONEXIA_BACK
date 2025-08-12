import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostulationStatus } from '../entities/postulation-status.entity';
import { Postulation } from '../entities/postulation.entity';

@Injectable()
export class PostulationRepository {
  constructor(
    @InjectRepository(Postulation)
    private readonly postulationRepository: Repository<Postulation>,
  ) {}

  async create(postulationData: Partial<Postulation>): Promise<Postulation> {
    const postulation = this.postulationRepository.create(postulationData);
    return await this.postulationRepository.save(postulation);
  }

  async findById(id: number): Promise<Postulation | null> {
    return await this.postulationRepository.findOne({
      where: { id },
      relations: ['project'],
    });
  }

  async findByProjectAndUser(
    projectId: number,
    userId: number,
  ): Promise<Postulation | null> {
    return await this.postulationRepository.findOne({
      where: { projectId, userId },
    });
  }

  async findByProject(
    projectId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<[Postulation[], number]> {
    const skip = (page - 1) * limit;
    return await this.postulationRepository.findAndCount({
      where: { projectId },
      relations: ['project'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<[Postulation[], number]> {
    const skip = (page - 1) * limit;
    return await this.postulationRepository.findAndCount({
      where: { userId },
      relations: ['project'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    id: number,
    status: PostulationStatus,
  ): Promise<Postulation | null> {
    await this.postulationRepository.update(id, { status });
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.postulationRepository.delete(id);
  }

  async countByProject(projectId: number): Promise<number> {
    return await this.postulationRepository.count({
      where: { projectId, statusId: 1 },
    });
  }

  async existsByProjectAndUser(
    projectId: number,
    userId: number,
  ): Promise<boolean> {
    const count = await this.postulationRepository.count({
      where: { projectId, userId },
    });
    return count > 0;
  }
}
