import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async findById(id: number): Promise<Project | null> {
    return this.ormRepository.findOne({ where: { id } });
  }

  async findByIdWithRelations(id: number): Promise<Project | null> {
    return this.ormRepository.findOne({
      where: { id },
      relations: [
        'category',
        'collaborationType',
        'contractType',
        'projectSkills',
      ],
    });
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
      where: { isActive: true },
      relations: [
        'category',
        'collaborationType',
        'contractType',
        'projectSkills',
      ],
    });
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

  ping(): string {
    return 'pong';
  }
}
