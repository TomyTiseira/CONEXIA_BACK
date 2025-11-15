import { Injectable } from '@nestjs/common';
import {
  CategoryNotFoundException,
  CollaborationTypeNotFoundException,
  ContractTypeNotFoundException,
  InvalidExecutionPeriodException,
  InvalidSkillsException,
  LocalityNotFoundException,
  PastStartDateException,
  ProjectNotFoundException,
  ProjectBadRequestException,
  UserNotFoundException,
} from '../../../common/exceptions/project.exceptions';
import { UsersClientService } from '../../../common/services/users-client.service';
import { PublishProjectDto } from '../../dtos/publish-project.dto';
import { ProjectRepository } from '../../repositories/project.repository';

@Injectable()
export class PublishProjectUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly usersClientService: UsersClientService,
  ) {}

  async execute(projectData: PublishProjectDto) {
    // Validar que el usuario existe
    const userExists = await this.usersClientService.validateUserExists(
      projectData.userId,
    );
    if (!userExists) {
      throw new UserNotFoundException(projectData.userId);
    }

    // Validar que el usuario esté verificado
    await this.usersClientService.validateUserIsVerified(projectData.userId);

    // Validar que la categoría existe
    const category = await this.projectRepository.findCategoryById(
      projectData.categoryId,
    );
    if (!category) {
      throw new CategoryNotFoundException(projectData.categoryId);
    }

    // Validar por cada role: skills, contractType y collaborationType si se proporcionan
    if (!projectData.roles || projectData.roles.length === 0) {
      throw new ProjectBadRequestException(
        'Project must have at least one role defined',
      );
    }

    for (const r of projectData.roles) {
      if (r.skills && r.skills.length > 0) {
        const skillsValidation =
          await this.usersClientService.validateSkillsExist(r.skills);
        if (!skillsValidation.valid) {
          throw new InvalidSkillsException(skillsValidation.invalidIds);
        }
      }

      if (r.collaborationTypeId) {
        const collaborationType =
          await this.projectRepository.findCollaborationTypeById(
            r.collaborationTypeId,
          );
        if (!collaborationType) {
          throw new CollaborationTypeNotFoundException(r.collaborationTypeId);
        }
      }

      if (r.contractTypeId) {
        const contractType =
          await this.projectRepository.findContractTypeById(r.contractTypeId);
        if (!contractType) {
          throw new ContractTypeNotFoundException(r.contractTypeId);
        }
      }
    }

    // Validar que la localidad existe (si se proporciona)
    if (projectData.location) {
      const localityExists =
        await this.usersClientService.validateLocalityExists(
          projectData.location,
        );
      if (!localityExists) {
        throw new LocalityNotFoundException(projectData.location);
      }
    }

    // Validar que la fecha de inicio sea anterior a la fecha de fin (solo si se proporcionan ambas)
    if (projectData.startDate && projectData.endDate) {
      if (new Date(projectData.startDate) >= new Date(projectData.endDate)) {
        throw new InvalidExecutionPeriodException();
      }

      // Validar que la fecha de inicio no sea en el pasado
      if (new Date(projectData.startDate) < new Date()) {
        throw new PastStartDateException();
      }
    }

    // Preparar datos del proyecto para creación
    const projectToCreate = {
      userId: projectData.userId,
      title: projectData.title,
      description: projectData.description,
      categoryId: projectData.categoryId,
      startDate: projectData.startDate
        ? new Date(projectData.startDate)
        : undefined,
      endDate: projectData.endDate ? new Date(projectData.endDate) : undefined,
      locationId: projectData.location || undefined,
      image: projectData.image || undefined,
      requiresPartner: projectData.requiresPartner || false,
      requiresInvestor: projectData.requiresInvestor || false,
    };

    // Crear proyecto
    const project = await this.projectRepository.create(projectToCreate);

    // Crear roles (incluye validación previa de skills y tipos)
    await this.projectRepository.createProjectRoles(
      project.id,
      projectData.roles as any,
    );

    // Obtener el proyecto con todas las relaciones
    const projectWithRelations =
      await this.projectRepository.findByIdWithRelations(project.id);

    if (!projectWithRelations) {
      throw new ProjectNotFoundException(project.id);
    }

    return projectWithRelations;
  }
}
