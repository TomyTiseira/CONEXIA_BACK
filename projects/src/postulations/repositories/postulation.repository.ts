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

  async findByIdWithState(id: number): Promise<Postulation | null> {
    return await this.postulationRepository.findOne({
      where: { id },
      relations: ['project', 'status'],
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
  ): Promise<Postulation[]> {
    const skip = (page - 1) * limit;
    const [postulations] = await this.postulationRepository.findAndCount({
      where: { projectId },
      relations: ['project'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return postulations;
  }

  async findAndCountWithFilters(
    whereClause: { projectId: number; statusId?: number },
    page: number = 1,
    limit: number = 10,
  ): Promise<[Postulation[], number]> {
    const skip = (page - 1) * limit;

    // Construir el where clause dinámicamente
    const where: { projectId: number; statusId?: number } = {
      projectId: whereClause.projectId,
    };

    if (whereClause.statusId) {
      where.statusId = whereClause.statusId;
    }

    // Obtener postulaciones con ordenamiento especial: estado activo primero, luego por fecha
    const [postulations, total] = await this.postulationRepository.findAndCount(
      {
        where,
        relations: ['project', 'status'],
        skip,
        take: limit,
        order: {
          status: {
            code: 'ASC', // El estado activo tiene código 'activo' que viene primero alfabéticamente
          },
          createdAt: 'ASC', // Luego por fecha de creación (más viejo primero)
        },
      },
    );

    return [postulations, total];
  }

  async findByUserWithState(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<[Postulation[], number]> {
    const skip = (page - 1) * limit;
    return await this.postulationRepository.findAndCount({
      where: { userId },
      relations: ['project', 'status'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    id: number,
    status: PostulationStatus,
  ): Promise<Postulation | null> {
    await this.postulationRepository.update(id, { statusId: status.id });
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
