import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rubro } from 'src/shared/entities/rubro.entity';
import { Skill } from 'src/shared/entities/skill.entity';
import { IsNull, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CollaborationType } from '../entities/collaboration-type.entity';
import { ContractType } from '../entities/contract-type.entity';
import { ProjectSkill } from '../entities/project-skill.entity';
import { Project } from '../entities/project.entity';

@Injectable()
export class ProjectRepository {
  constructor(
    @InjectRepository(Project)
    private readonly ormRepository: Repository<Project>,
    @InjectRepository(ProjectSkill)
    private readonly projectSkillRepository: Repository<ProjectSkill>,
  ) {}

  async create(project: Partial<Project>): Promise<Project> {
    const entity = this.ormRepository.create(project);
    return this.ormRepository.save(entity);
  }

  async findProjectsByIds(projectIds: number[]): Promise<Project[]> {
    if (!projectIds || projectIds.length === 0) return [];
    return this.ormRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.category', 'category')
      .leftJoinAndSelect('project.collaborationType', 'collaborationType')
      .leftJoinAndSelect('project.contractType', 'contractType')
      .leftJoinAndSelect('project.projectSkills', 'projectSkills')
      .where('project.id IN (:...projectIds)', { projectIds })
      .andWhere('project.deletedAt IS NULL')
      .orderBy('project.createdAt', 'DESC')
      .getMany();
  }

  async findById(
    id: number,
    includeDeleted: boolean = false,
  ): Promise<Project | null> {
    const queryBuilder = this.ormRepository
      .createQueryBuilder('project')
      .where('project.id = :id', { id });

    // Incluir registros eliminados si se solicita
    if (includeDeleted) {
      queryBuilder.withDeleted();
    }

    return queryBuilder.getOne();
  }

  async findByIdWithRelations(
    id: number,
    includeDeleted: boolean = false,
  ): Promise<Project | null> {
    const queryBuilder = this.ormRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.category', 'category')
      .leftJoinAndSelect('project.collaborationType', 'collaborationType')
      .leftJoinAndSelect('project.contractType', 'contractType')
      .leftJoinAndSelect('project.projectSkills', 'projectSkills')
      .where('project.id = :id', { id });

    if (includeDeleted) {
      queryBuilder.withDeleted();
    }

    return queryBuilder.getOne();
  }

  async findAll(): Promise<Project[]> {
    return this.ormRepository.find({
      relations: [
        'category',
        'collaborationType',
        'contractType',
        'projectSkills',
      ],
    });
  }

  async findActive(): Promise<Project[]> {
    return this.ormRepository.find({
      where: { deletedAt: IsNull() },
      relations: [
        'category',
        'collaborationType',
        'contractType',
        'projectSkills',
      ],
    });
  }

  async findByUserId(
    userId: number,
    includeDeleted: boolean = false,
    page: number = 1,
    limit: number = 10,
  ): Promise<[Project[], number]> {
    const queryBuilder = this.ormRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.category', 'category')
      .leftJoinAndSelect('project.collaborationType', 'collaborationType')
      .leftJoinAndSelect('project.contractType', 'contractType')
      .leftJoinAndSelect('project.projectSkills', 'projectSkills')
      .where('project.userId = :userId', { userId });

    // Incluir registros eliminados si se solicita
    if (includeDeleted) {
      queryBuilder.withDeleted();
    }

    // Aplicar paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit).orderBy('project.createdAt', 'DESC');

    return queryBuilder.getManyAndCount();
  }

  async update(id: number, project: Partial<Project>): Promise<Project> {
    const existingProject = await this.ormRepository.findOne({ where: { id } });
    if (!existingProject) {
      throw new Error(`Project with id ${id} not found`);
    }

    const updatedProject = this.ormRepository.merge(existingProject, project);
    return this.ormRepository.save(updatedProject);
  }

  async delete(id: number): Promise<void> {
    await this.ormRepository.softDelete(id);
  }

  async deleteProject(project: Project, reason: string): Promise<void> {
    await this.ormRepository.update(project.id, {
      deletedAt: new Date(),
      deletedReason: reason || 'No reason provided',
      isActive: false,
    });
  }

  async findCategoryById(id: number): Promise<Category | null> {
    return this.ormRepository.manager.findOne(Category, { where: { id } });
  }

  async findCollaborationTypeById(
    id: number,
  ): Promise<CollaborationType | null> {
    return this.ormRepository.manager.findOne(CollaborationType, {
      where: { id },
    });
  }

  async findContractTypeById(id: number): Promise<ContractType | null> {
    return this.ormRepository.manager.findOne(ContractType, { where: { id } });
  }

  async findAllCategories(): Promise<Category[]> {
    return this.ormRepository.manager.find(Category, {
      order: { name: 'ASC' },
    });
  }

  async findAllCollaborationTypes(): Promise<CollaborationType[]> {
    return this.ormRepository.manager.find(CollaborationType, {
      order: { name: 'ASC' },
    });
  }

  async findAllContractTypes(): Promise<ContractType[]> {
    return this.ormRepository.manager.find(ContractType, {
      order: { name: 'ASC' },
    });
  }

  async createProjectSkills(
    projectId: number,
    skillIds: number[],
  ): Promise<void> {
    const projectSkills = skillIds.map((skillId) => ({
      projectId,
      skillId,
    }));

    await this.projectSkillRepository.save(projectSkills);
  }

  async getProjectSkills(projectId: number): Promise<number[]> {
    const projectSkills = await this.projectSkillRepository.find({
      where: { projectId },
    });

    return projectSkills.map((ps) => ps.skillId);
  }

  async deleteProjectSkills(projectId: number): Promise<void> {
    await this.projectSkillRepository.delete({ projectId });
  }

  async findProjectsWithFilters(filters: {
    search?: string;
    categoryIds?: number[];
    skillIds?: number[];
    collaborationTypeIds?: number[];
    contractTypeIds?: number[];
    page: number;
    limit: number;
  }): Promise<[Project[], number]> {
    // 1. Obtener los IDs únicos de los proyectos paginados
    const idQueryBuilder = this.ormRepository
      .createQueryBuilder('project')
      .select('project.id')
      .where('project.deletedAt IS NULL');

    if (filters.search) {
      idQueryBuilder.andWhere('project.title ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      idQueryBuilder.andWhere('project.categoryId IN (:...categoryIds)', {
        categoryIds: filters.categoryIds,
      });
    }
    // NOTA: Para filtrar por skills, colaboración y contratación, se requiere join, pero para IDs solo filtramos por project.
    // Si necesitas filtrar por skills, deberías hacer un subquery o join aquí también.
    if (
      filters.collaborationTypeIds &&
      filters.collaborationTypeIds.length > 0
    ) {
      idQueryBuilder.andWhere(
        'project.collaborationTypeId IN (:...collaborationTypeIds)',
        {
          collaborationTypeIds: filters.collaborationTypeIds,
        },
      );
    }
    if (filters.contractTypeIds && filters.contractTypeIds.length > 0) {
      idQueryBuilder.andWhere(
        'project.contractTypeId IN (:...contractTypeIds)',
        {
          contractTypeIds: filters.contractTypeIds,
        },
      );
    }

    idQueryBuilder.orderBy('project.createdAt', 'DESC');
    const skip = (filters.page - 1) * filters.limit;
    idQueryBuilder.skip(skip).take(filters.limit);

    const idsResult = await idQueryBuilder.getMany();
    const projectIds = idsResult.map((p) => p.id);

    if (projectIds.length === 0) {
      return [[], 0];
    }

    // 2. Traer los proyectos completos con relaciones usando los IDs obtenidos
    const projects = await this.ormRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.category', 'category')
      .leftJoinAndSelect('project.collaborationType', 'collaborationType')
      .leftJoinAndSelect('project.contractType', 'contractType')
      .leftJoinAndSelect('project.projectSkills', 'projectSkills')
      .where('project.id IN (:...projectIds)', { projectIds })
      .orderBy('project.createdAt', 'DESC')
      .getMany();

    // 3. Obtener el total de proyectos (sin paginación)
    const total = await this.ormRepository.count({
      where: { deletedAt: IsNull() },
    });

    return [projects, total];
  }

  // get skills by rubro
  async getSkillsByRubro(rubroId: number): Promise<Skill[]> {
    return this.ormRepository.manager.find(Skill, {
      where: { rubroId },
      order: { name: 'ASC' },
    });
  }

  async findRubroById(id: number): Promise<Rubro | null> {
    return this.ormRepository.manager.findOne(Rubro, { where: { id } });
  }

  async getRubros(): Promise<Rubro[]> {
    return this.ormRepository.manager.find(Rubro);
  }

  /**
   * Obtiene proyectos completados de un usuario que tuvieron al menos un colaborador aprobado
   */
  async findCompletedProjectsByUserId(userId: number): Promise<Project[]> {
    const now = new Date();

    return this.ormRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.postulations', 'postulation')
      .leftJoin('postulation.status', 'postulationStatus')
      .where('project.userId = :userId', { userId })
      .andWhere('project.deletedAt IS NULL')
      .andWhere('project.endDate < :now', { now })
      .andWhere('postulationStatus.code = :approvedCode', {
        approvedCode: 'approved',
      })
      .groupBy('project.id')
      .having('COUNT(DISTINCT postulation.id) > 0')
      .getMany();
  }

  /**
   * Obtiene el total de proyectos (incluyendo eliminados)
   */
  async getTotalCount(): Promise<number> {
    return this.ormRepository.count();
  }

  /**
   * Obtiene el total de proyectos completados
   */
  async getCompletedCount(): Promise<number> {
    const now = new Date();

    const result = await this.ormRepository
      .createQueryBuilder('project')
      .leftJoin('project.postulations', 'postulation')
      .leftJoin('postulation.status', 'postulationStatus')
      .where('project.deletedAt IS NULL')
      .andWhere('project.endDate < :now', { now })
      .andWhere('postulationStatus.code = :approvedCode', {
        approvedCode: 'approved',
      })
      .groupBy('project.id')
      .having('COUNT(DISTINCT postulation.id) > 0')
      .getCount();

    return result;
  }

  /**
   * Obtiene el total de proyectos activos (no eliminados y con fecha futura o sin fecha)
   */
  async getActiveCount(): Promise<number> {
    const now = new Date();

    return this.ormRepository
      .createQueryBuilder('project')
      .where('project.deletedAt IS NULL')
      .andWhere('(project.endDate > :now OR project.endDate IS NULL)', { now })
      .getCount();
  }

  ping(): string {
    return 'pong';
  }
}
