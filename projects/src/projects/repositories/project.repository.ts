import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
    const queryBuilder = this.ormRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.category', 'category')
      .leftJoinAndSelect('project.collaborationType', 'collaborationType')
      .leftJoinAndSelect('project.contractType', 'contractType')
      .leftJoinAndSelect('project.projectSkills', 'projectSkills')
      .where('project.deletedAt IS NULL');

    // Filtro de búsqueda por título
    if (filters.search) {
      queryBuilder.andWhere('project.title ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    // Filtro por categorías
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      queryBuilder.andWhere('project.categoryId IN (:...categoryIds)', {
        categoryIds: filters.categoryIds,
      });
    }

    // Filtro por habilidades requeridas
    if (filters.skillIds && filters.skillIds.length > 0) {
      queryBuilder.andWhere('projectSkills.skillId IN (:...skillIds)', {
        skillIds: filters.skillIds,
      });
    }

    // Filtro por tipos de colaboración
    if (
      filters.collaborationTypeIds &&
      filters.collaborationTypeIds.length > 0
    ) {
      queryBuilder.andWhere(
        'project.collaborationTypeId IN (:...collaborationTypeIds)',
        {
          collaborationTypeIds: filters.collaborationTypeIds,
        },
      );
    }

    // Filtro por tipos de contratación
    if (filters.contractTypeIds && filters.contractTypeIds.length > 0) {
      queryBuilder.andWhere('project.contractTypeId IN (:...contractTypeIds)', {
        contractTypeIds: filters.contractTypeIds,
      });
    }

    // Aplicar paginación
    const skip = (filters.page - 1) * filters.limit;
    queryBuilder
      .skip(skip)
      .take(filters.limit)
      .orderBy('project.createdAt', 'DESC');

    return queryBuilder.getManyAndCount();
  }

  ping(): string {
    return 'pong';
  }
}
