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
  UserNotFoundException,
} from '../../../common/exceptions/project.exceptions';
import { PublishProjectDto } from '../../dtos/publish-project.dto';
import { ProjectRepository } from '../../repositories/project.repository';
import { UsersClientService } from '../users-client.service';

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

    // Validar que las skills existen (si se proporcionan)
    if (projectData.skills && projectData.skills.length > 0) {
      const skillsValidation =
        await this.usersClientService.validateSkillsExist(projectData.skills);
      if (!skillsValidation.valid) {
        throw new InvalidSkillsException(skillsValidation.invalidIds);
      }
    }

    // Validar que la categoría existe
    const category = await this.projectRepository.findCategoryById(
      projectData.categoryId,
    );
    if (!category) {
      throw new CategoryNotFoundException(projectData.categoryId);
    }

    // Validar que el tipo de colaboración existe
    const collaborationType =
      await this.projectRepository.findCollaborationTypeById(
        projectData.collaborationTypeId,
      );
    if (!collaborationType) {
      throw new CollaborationTypeNotFoundException(
        projectData.collaborationTypeId,
      );
    }

    // Validar que el tipo de contrato existe
    const contractType = await this.projectRepository.findContractTypeById(
      projectData.contractTypeId,
    );
    if (!contractType) {
      throw new ContractTypeNotFoundException(projectData.contractTypeId);
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
      collaborationTypeId: projectData.collaborationTypeId,
      contractTypeId: projectData.contractTypeId,
      startDate: projectData.startDate
        ? new Date(projectData.startDate)
        : undefined,
      endDate: projectData.endDate ? new Date(projectData.endDate) : undefined,
      locationId: projectData.location || undefined,
      maxCollaborators: projectData.maxCollaborators || undefined,
      image: projectData.image || undefined,
      isActive: true,
    };

    // Crear proyecto
    const project = await this.projectRepository.create(projectToCreate);

    // Crear las habilidades del proyecto si se proporcionan
    if (projectData.skills && projectData.skills.length > 0) {
      await this.projectRepository.createProjectSkills(
        project.id,
        projectData.skills,
      );
    }

    // Obtener el proyecto con todas las relaciones
    const projectWithRelations =
      await this.projectRepository.findByIdWithRelations(project.id);

    if (!projectWithRelations) {
      throw new ProjectNotFoundException(project.id);
    }

    return projectWithRelations;
  }
}
