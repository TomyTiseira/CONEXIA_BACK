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

  /**
   * Obtiene postulaciones de un usuario para proyectos específicos
   * Evita cargar todas las postulaciones del usuario
   */
  async findByUserForProjects(
    userId: number,
    projectIds: number[],
  ): Promise<Postulation[]> {
    if (!projectIds || projectIds.length === 0) return [];

    return await this.postulationRepository
      .createQueryBuilder('postulation')
      .leftJoinAndSelect('postulation.status', 'status')
      .where('postulation.userId = :userId', { userId })
      .andWhere('postulation.projectId IN (:...projectIds)', { projectIds })
      .orderBy('postulation.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Obtiene el conteo de postulaciones aprobadas para múltiples proyectos
   * Evita hacer consultas individuales por proyecto
   */
  async getApprovedCountsByProjects(
    projectIds: number[],
    statusAccepted: number = 2,
  ): Promise<Map<number, number>> {
    if (!projectIds || projectIds.length === 0) return new Map();

    const results = await this.postulationRepository
      .createQueryBuilder('postulation')
      .select('postulation.projectId', 'projectId')
      .addSelect('COUNT(*)', 'count')
      .where('postulation.projectId IN (:...projectIds)', { projectIds })
      .andWhere('postulation.statusId = :statusAccepted', { statusAccepted })
      .groupBy('postulation.projectId')
      .getRawMany();

    const countMap = new Map<number, number>();
    for (const result of results) {
      countMap.set(parseInt(result.projectId), parseInt(result.count));
    }

    // Agregar proyectos sin postulaciones aprobadas con conteo 0
    for (const projectId of projectIds) {
      if (!countMap.has(projectId)) {
        countMap.set(projectId, 0);
      }
    }

    return countMap;
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
