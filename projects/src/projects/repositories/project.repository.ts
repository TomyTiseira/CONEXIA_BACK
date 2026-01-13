import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProjectNotFoundException } from 'src/common/exceptions/project.exceptions';
import { Rubro } from 'src/shared/entities/rubro.entity';
import { Skill } from 'src/shared/entities/skill.entity';
import { IsNull, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CollaborationType } from '../entities/collaboration-type.entity';
import { ContractType } from '../entities/contract-type.entity';
import { ProjectRole } from '../entities/project-role.entity';
import { ProjectSkill } from '../entities/project-skill.entity';
import { Project } from '../entities/project.entity';
import { RoleEvaluation } from '../entities/role-evaluation.entity';
import { RoleQuestionOption } from '../entities/role-question-option.entity';
import { RoleQuestion } from '../entities/role-question.entity';
import { RoleSkill } from '../entities/role-skill.entity';

@Injectable()
export class ProjectRepository {
  constructor(
    @InjectRepository(Project)
    private readonly ormRepository: Repository<Project>,
    @InjectRepository(ProjectSkill)
    private readonly projectSkillRepository: Repository<ProjectSkill>,
    @InjectRepository(RoleSkill)
    private readonly roleSkillRepository: Repository<RoleSkill>,
    @InjectRepository(ProjectRole)
    private readonly projectRoleRepository: Repository<ProjectRole>,
    @InjectRepository(RoleQuestion)
    private readonly roleQuestionRepository: Repository<RoleQuestion>,
    @InjectRepository(RoleQuestionOption)
    private readonly roleQuestionOptionRepository: Repository<RoleQuestionOption>,
    @InjectRepository(RoleEvaluation)
    private readonly roleEvaluationRepository: Repository<RoleEvaluation>,
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
      .leftJoinAndSelect('project.roles', 'roles')
      .leftJoinAndSelect('roles.contractType', 'contractType')
      .leftJoinAndSelect('roles.collaborationType', 'collaborationType')
      .leftJoinAndSelect('roles.roleSkills', 'roleSkills')
      .leftJoinAndSelect('roles.questions', 'questions')
      .leftJoinAndSelect('roles.evaluations', 'evaluations')
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
      .leftJoinAndSelect('project.roles', 'roles')
      .leftJoinAndSelect('roles.contractType', 'contractType')
      .leftJoinAndSelect('roles.collaborationType', 'collaborationType')
      .leftJoinAndSelect('roles.roleSkills', 'roleSkills')
      .leftJoinAndSelect('roles.questions', 'questions')
      .leftJoinAndSelect('questions.options', 'options')
      .leftJoinAndSelect('roles.evaluations', 'evaluations')
      .where('project.id = :id', { id });

    if (includeDeleted) {
      queryBuilder.withDeleted();
    }

    return queryBuilder.getOne();
  }

  async findAll(): Promise<Project[]> {
    return this.ormRepository.find({ relations: ['category', 'roles'] });
  }

  async findActive(): Promise<Project[]> {
    return this.ormRepository.find({
      where: { deletedAt: IsNull() },
      relations: ['category', 'roles'],
    });
  }

  async findByUserIdPaginated(
    userId: number,
    includeDeleted: boolean = false,
    page: number = 1,
    limit: number = 10,
  ): Promise<[Project[], number]> {
    const queryBuilder = this.ormRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.category', 'category')
      .leftJoinAndSelect('project.roles', 'roles')
      .leftJoinAndSelect('roles.contractType', 'contractType')
      .leftJoinAndSelect('roles.collaborationType', 'collaborationType')
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
      throw new ProjectNotFoundException(id);
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

  /**
   * Crea roles del proyecto y sus preguntas/evaluaciones si vienen en el payload
   */
  async createProjectRoles(projectId: number, roles: any[]): Promise<void> {
    if (!roles || roles.length === 0) return;

    for (const r of roles) {
      const roleToSave: Partial<ProjectRole> = {
        projectId,
        title: r.title,
        description: r.description,
        applicationTypes: r.applicationTypes || [],
        contractTypeId: r.contractTypeId || undefined,
        collaborationTypeId: r.collaborationTypeId || undefined,
        maxCollaborators: r.maxCollaborators || undefined,
      };

      const savedRole = await this.projectRoleRepository.save(
        roleToSave as any,
      );
      // Questions
      if (r.questions && r.questions.length > 0) {
        for (const q of r.questions) {
          const question = await this.roleQuestionRepository.save({
            roleId: savedRole.id,
            questionText: q.questionText,
            questionType: q.questionType,
            required: q.required !== undefined ? q.required : true,
          } as any);

          if (q.options && q.options.length > 0) {
            const options = q.options.map((opt: any) => ({
              questionId: question.id,
              optionText: typeof opt === 'string' ? opt : opt.optionText,
              isCorrect:
                typeof opt === 'object' && opt.isCorrect ? true : false,
            }));
            await this.roleQuestionOptionRepository.save(options as any);
          }
        }
      }

      // Evaluation
      if (r.evaluation) {
        await this.roleEvaluationRepository.save({
          roleId: savedRole.id,
          description: r.evaluation.description,
          link: r.evaluation.link,
          fileUrl: r.evaluation.fileUrl,
          fileName: r.evaluation.fileName,
          fileSize: r.evaluation.fileSize,
          fileMimeType: r.evaluation.fileMimeType,
          days: r.evaluation.days ?? 10,
        } as any);
      }

      // Role skills
      if (r.skills && r.skills.length > 0) {
        const roleSkills = r.skills.map((skillId: number) => ({
          roleId: savedRole.id,
          skillId,
        }));
        await this.roleSkillRepository.save(roleSkills as any);
      }
    }
  }

  async getProjectSkills(projectId: number): Promise<number[]> {
    // Get skills from role_skills by joining the role -> project
    const roleSkills = await this.roleSkillRepository
      .createQueryBuilder('rs')
      .innerJoin('rs.role', 'role')
      .where('role.projectId = :projectId', { projectId })
      .getMany();

    return roleSkills.map((rs) => rs.skillId);
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
      .select('project.id', 'id')
      .addSelect('project.createdAt', 'createdAt')
      .distinct(true)
      .where('project.deletedAt IS NULL')
      .andWhere('(project.suspendedByModeration IS NULL OR project.suspendedByModeration = :suspended)', { suspended: false });

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

    // Filtro por skillIds: debe tener al menos una skill de las especificadas en sus roles
    if (filters.skillIds && filters.skillIds.length > 0) {
      idQueryBuilder
        .innerJoin('project.roles', 'role')
        .innerJoin('role.roleSkills', 'roleSkill')
        .andWhere('roleSkill.skillId IN (:...skillIds)', {
          skillIds: filters.skillIds,
        });
    }

    // Filtro por collaborationTypeIds: debe tener al menos un rol con uno de los tipos de colaboración especificados
    if (
      filters.collaborationTypeIds &&
      filters.collaborationTypeIds.length > 0
    ) {
      if (filters.skillIds && filters.skillIds.length > 0) {
        // Ya hicimos innerJoin con 'role', reutilizamos
        idQueryBuilder.andWhere(
          'role.collaborationTypeId IN (:...collaborationTypeIds)',
          {
            collaborationTypeIds: filters.collaborationTypeIds,
          },
        );
      } else {
        idQueryBuilder
          .innerJoin('project.roles', 'role')
          .andWhere('role.collaborationTypeId IN (:...collaborationTypeIds)', {
            collaborationTypeIds: filters.collaborationTypeIds,
          });
      }
    }

    // Filtro por contractTypeIds: debe tener al menos un rol con uno de los tipos de contrato especificados
    if (filters.contractTypeIds && filters.contractTypeIds.length > 0) {
      if (
        (filters.skillIds && filters.skillIds.length > 0) ||
        (filters.collaborationTypeIds &&
          filters.collaborationTypeIds.length > 0)
      ) {
        // Ya hicimos innerJoin con 'role', reutilizamos
        idQueryBuilder.andWhere(
          'role.contractTypeId IN (:...contractTypeIds)',
          {
            contractTypeIds: filters.contractTypeIds,
          },
        );
      } else {
        idQueryBuilder
          .innerJoin('project.roles', 'role')
          .andWhere('role.contractTypeId IN (:...contractTypeIds)', {
            contractTypeIds: filters.contractTypeIds,
          });
      }
    }

    idQueryBuilder.orderBy('project.createdAt', 'DESC');
    const skip = (filters.page - 1) * filters.limit;
    idQueryBuilder.skip(skip).take(filters.limit);

    const idsResult = await idQueryBuilder.getRawMany();
    const projectIds = idsResult.map((p) => p.id);

    if (projectIds.length === 0) {
      return [[], 0];
    }

    // 2. Traer los proyectos completos con relaciones usando los IDs obtenidos
    const projects = await this.ormRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.category', 'category')
      .leftJoinAndSelect('project.roles', 'roles')
      .leftJoinAndSelect('roles.questions', 'questions')
      .leftJoinAndSelect('roles.evaluations', 'evaluations')
      .where('project.id IN (:...projectIds)', { projectIds })
      .orderBy('project.createdAt', 'DESC')
      .getMany();

    // 3. Obtener el total de proyectos que cumplen con los filtros (sin paginación)
    const countQueryBuilder = this.ormRepository
      .createQueryBuilder('project')
      .select('COUNT(DISTINCT project.id)', 'count')
      .where('project.deletedAt IS NULL');

    if (filters.search) {
      countQueryBuilder.andWhere('project.title ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      countQueryBuilder.andWhere('project.categoryId IN (:...categoryIds)', {
        categoryIds: filters.categoryIds,
      });
    }
    if (filters.skillIds && filters.skillIds.length > 0) {
      countQueryBuilder
        .innerJoin('project.roles', 'roleCount')
        .innerJoin('roleCount.roleSkills', 'roleSkillCount')
        .andWhere('roleSkillCount.skillId IN (:...skillIds)', {
          skillIds: filters.skillIds,
        });
    }
    if (
      filters.collaborationTypeIds &&
      filters.collaborationTypeIds.length > 0
    ) {
      if (filters.skillIds && filters.skillIds.length > 0) {
        countQueryBuilder.andWhere(
          'roleCount.collaborationTypeId IN (:...collaborationTypeIds)',
          {
            collaborationTypeIds: filters.collaborationTypeIds,
          },
        );
      } else {
        countQueryBuilder
          .innerJoin('project.roles', 'roleCount')
          .andWhere(
            'roleCount.collaborationTypeId IN (:...collaborationTypeIds)',
            {
              collaborationTypeIds: filters.collaborationTypeIds,
            },
          );
      }
    }
    if (filters.contractTypeIds && filters.contractTypeIds.length > 0) {
      if (
        (filters.skillIds && filters.skillIds.length > 0) ||
        (filters.collaborationTypeIds &&
          filters.collaborationTypeIds.length > 0)
      ) {
        countQueryBuilder.andWhere(
          'roleCount.contractTypeId IN (:...contractTypeIds)',
          {
            contractTypeIds: filters.contractTypeIds,
          },
        );
      } else {
        countQueryBuilder
          .innerJoin('project.roles', 'roleCount')
          .andWhere('roleCount.contractTypeId IN (:...contractTypeIds)', {
            contractTypeIds: filters.contractTypeIds,
          });
      }
    }

    const countResult = await countQueryBuilder.getRawOne();
    const total = parseInt(countResult?.count || '0', 10);

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

  async findRoleById(roleId: number) {
    return this.ormRepository.manager.findOne(ProjectRole, {
      where: { id: roleId },
    });
  }

  async findRoleByIdWithRelations(roleId: number) {
    return this.ormRepository.manager.findOne(ProjectRole, {
      where: { id: roleId },
      relations: ['questions', 'questions.options', 'evaluations', 'project'],
    });
  }

  /**
   * Obtiene proyectos completados de un usuario que tuvieron al menos un colaborador aprobado
   */
  async findCompletedProjectsByUserId(userId: number): Promise<Project[]> {
    const now = new Date();

    return this.ormRepository
      .createQueryBuilder('project')
      .leftJoin('project.postulations', 'postulation')
      .leftJoin('postulation.status', 'postulationStatus')
      .where('project.userId = :userId', { userId })
      .andWhere('project.deletedAt IS NULL')
      .andWhere('project.endDate < :now', { now })
      .andWhere('postulationStatus.code = :approvedCode', {
        approvedCode: 'aceptada',
      })
      .groupBy('project.id')
      .addGroupBy('project.title')
      .addGroupBy('project.description')
      .addGroupBy('project.user_id')
      .addGroupBy('project.categoryId')
      .addGroupBy('project.start_date')
      .addGroupBy('project.end_date')
      .addGroupBy('project.location_id')
      .addGroupBy('project.requires_partner')
      .addGroupBy('project.requires_investor')
      .addGroupBy('project.image')
      .addGroupBy('project.isActive')
      .addGroupBy('project.deletedReason')
      .addGroupBy('project.createdAt')
      .addGroupBy('project.updatedAt')
      .addGroupBy('project.deletedAt')
      .having('COUNT(DISTINCT postulation.id) > 0')
      .getMany();
  }

  /**
   * Obtiene el total de proyectos (excluyendo eliminados)
   */
  async getTotalCount(): Promise<number> {
    return this.ormRepository.count({
      where: {
        deletedAt: null as any,
      },
    });
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
        approvedCode: 'aceptada',
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

  /**
   * Obtiene todos los proyectos de un usuario (sin paginación, para métricas)
   */
  async findByUserId(userId: number): Promise<Project[]> {
    return this.ormRepository
      .createQueryBuilder('project')
      .where('project.userId = :userId', { userId })
      .andWhere('project.deletedAt IS NULL')
      .getMany();
  }

  ping(): string {
    return 'pong';
  }
}
