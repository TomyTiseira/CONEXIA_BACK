import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostulationAnswer } from '../entities/postulation-answer.entity';
import { PostulationStatus } from '../entities/postulation-status.entity';
import { Postulation } from '../entities/postulation.entity';

@Injectable()
export class PostulationRepository {
  constructor(
    @InjectRepository(Postulation)
    private readonly postulationRepository: Repository<Postulation>,
    @InjectRepository(PostulationAnswer)
    private readonly postulationAnswerRepository: Repository<PostulationAnswer>,
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
      relations: ['status'],
    });
  }

  async findByRoleAndUser(
    roleId: number,
    userId: number,
  ): Promise<Postulation | null> {
    return await this.postulationRepository.findOne({
      where: { roleId, userId },
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
    whereClause: { projectId: number; statusId?: number; roleId?: number },
    page: number = 1,
    limit: number = 10,
  ): Promise<[Postulation[], number]> {
    const skip = (page - 1) * limit;

    // Construir el where clause dinámicamente
    const where: { projectId: number; statusId?: number; roleId?: number } = {
      projectId: whereClause.projectId,
    };

    if (whereClause.statusId) {
      where.statusId = whereClause.statusId;
    }

    if (whereClause.roleId) {
      where.roleId = whereClause.roleId;
    }

    // Obtener postulaciones con ordenamiento especial: estado activo primero, luego por fecha
    const [postulations, total] = await this.postulationRepository.findAndCount(
      {
        where,
        relations: [
          'project',
          'status',
          'role',
          'role.questions',
          'role.questions.options',
          'answers',
          'answers.question',
        ],
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

  async update(
    id: number,
    updateData: Partial<Postulation>,
  ): Promise<Postulation | null> {
    await this.postulationRepository.update(id, updateData);
    return await this.findByIdWithState(id);
  }

  async createWithAnswers(
    postulationData: Partial<Postulation>,
    answers?: { questionId: number; optionId?: number; answerText?: string }[],
  ): Promise<Postulation> {
    // Use a transaction to create postulation and answers atomically
    return await this.postulationRepository.manager.transaction(
      async (manager) => {
        const postulation = manager.create(Postulation, postulationData);
        const saved = await manager.save(postulation);

        if (answers && answers.length > 0) {
          const answerEntities = answers.map((a) => ({
            postulationId: saved.id,
            questionId: a.questionId,
            optionId: a.optionId,
            answerText: a.answerText,
          }));
          await manager.save(PostulationAnswer, answerEntities as any);
        }

        return saved;
      },
    );
  }

  async delete(id: number): Promise<void> {
    await this.postulationRepository.delete(id);
  }

  async countByProject(projectId: number): Promise<number> {
    return await this.postulationRepository.count({
      where: { projectId, statusId: 1 },
    });
  }

  async countAcceptedByRole(roleId: number): Promise<number> {
    return await this.postulationRepository.count({
      where: { roleId, statusId: 1 },
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

  /**
   * Obtiene todas las postulaciones de un usuario (sin paginación)
   */
  async findByUserId(userId: number): Promise<Postulation[]> {
    return await this.postulationRepository.find({
      where: { userId },
      relations: ['status'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtiene todas las postulaciones de una lista de proyectos
   */
  async findByProjectIds(projectIds: number[]): Promise<Postulation[]> {
    if (!projectIds || projectIds.length === 0) {
      return [];
    }

    return await this.postulationRepository
      .createQueryBuilder('postulation')
      .leftJoinAndSelect('postulation.status', 'status')
      .where('postulation.projectId IN (:...projectIds)', { projectIds })
      .orderBy('postulation.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Obtiene la última postulación (con estado) de un usuario para cada rol de un proyecto.
   * Devuelve un Map de roleId -> { code, name } del estado.
   */
  async findLatestByProjectAndUserPerRole(
    projectId: number,
    userId: number,
  ): Promise<Map<number, { code: string; name: string }>> {
    const postulations = await this.postulationRepository
      .createQueryBuilder('postulation')
      .leftJoinAndSelect('postulation.status', 'status')
      .where('postulation.projectId = :projectId', { projectId })
      .andWhere('postulation.userId = :userId', { userId })
      .orderBy('postulation.createdAt', 'DESC')
      .getMany();

    const map = new Map<number, { code: string; name: string }>();
    for (const p of postulations) {
      if (p.roleId != null && !map.has(p.roleId) && p.status) {
        map.set(p.roleId, { code: p.status.code, name: p.status.name });
      }
    }
    return map;
  }

  /**
   * Cuenta las postulaciones de un proyecto específico
   */
  async countByProjectId(projectId: number): Promise<number> {
    return await this.postulationRepository.count({
      where: { projectId },
    });
  }

  /**
   * Obtiene todas las postulaciones de un proyecto con detalles completos (para estadísticas)
   */
  async findByProjectIdWithDetails(projectId: number): Promise<Postulation[]> {
    return await this.postulationRepository.find({
      where: { projectId },
      relations: ['role', 'answers', 'answers.question', 'status'],
      order: { createdAt: 'DESC' },
    });
  }
}
