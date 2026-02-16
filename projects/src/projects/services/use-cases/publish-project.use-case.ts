import { Inject, Injectable } from '@nestjs/common';
import { FileStorage } from '../../../common/domain/interfaces/file-storage.interface';
import {
  CategoryNotFoundException,
  CollaborationTypeNotFoundException,
  ContractTypeNotFoundException,
  InvalidExecutionPeriodException,
  InvalidSkillsException,
  LocalityNotFoundException,
  PastStartDateException,
  ProjectBadRequestException,
  ProjectLimitExceededException,
  ProjectNotFoundException,
  UserNotFoundException,
} from '../../../common/exceptions/project.exceptions';
import { MembershipsClientService } from '../../../common/services/memberships-client.service';
import { UsersClientService } from '../../../common/services/users-client.service';
import {
  ApplicationType,
  PublishProjectDto,
} from '../../dtos/publish-project.dto';
import { ProjectRepository } from '../../repositories/project.repository';

@Injectable()
export class PublishProjectUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly usersClientService: UsersClientService,
    private readonly membershipsClientService: MembershipsClientService,
    @Inject('FILE_STORAGE')
    private readonly fileStorage: FileStorage,
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

    // Validar límite de proyectos según el plan de suscripción
    const [activeProjects] = await this.projectRepository.findByUserIdPaginated(
      projectData.userId,
      false,
      1,
      9999,
    );
    const activeProjectsCount = activeProjects.length;

    const { canPublish, limit, current } =
      await this.membershipsClientService.canPublishProject(
        projectData.userId,
        activeProjectsCount,
      );

    if (!canPublish) {
      throw new ProjectLimitExceededException(limit, current);
    }

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
        const contractType = await this.projectRepository.findContractTypeById(
          r.contractTypeId,
        );
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

    // Process project image: base64 → upload → URL
    let projectImageUrl: string | undefined;

    if (projectData.imageFile) {
      // New base64 approach
      const buffer = Buffer.from(projectData.imageFile.fileData, 'base64');
      const timestamp = Date.now();
      const extension = this.getExtensionFromMimeType(
        projectData.imageFile.mimeType,
      );
      const filename = `project-${projectData.userId}-${timestamp}.${extension}`;

      projectImageUrl = await this.fileStorage.upload(
        buffer,
        filename,
        projectData.imageFile.mimeType,
      );
    } else if (projectData.image) {
      // Legacy URL approach
      projectImageUrl = projectData.image;
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
      image: projectImageUrl || undefined,
      requiresPartner: projectData.requiresPartner || false,
      requiresInvestor: projectData.requiresInvestor || false,
    };

    // Crear proyecto
    const project = await this.projectRepository.create(projectToCreate);

    // Preparar roles a crear (roles definidos por el usuario + roles automáticos)
    const rolesToCreate = [...projectData.roles];

    // Process evaluation files for each role
    for (let i = 0; i < rolesToCreate.length; i++) {
      const role = rolesToCreate[i];
      if (
        role.evaluation?.evaluationFile &&
        role.applicationTypes?.includes(ApplicationType.EVALUATION)
      ) {
        // New base64 approach
        const buffer = Buffer.from(
          role.evaluation.evaluationFile.fileData,
          'base64',
        );
        const timestamp = Date.now();
        const extension = this.getExtensionFromMimeType(
          role.evaluation.evaluationFile.mimeType,
        );
        const filename = `evaluation-${projectData.userId}-${timestamp}-${i}.${extension}`;

        const fileUrl = await this.fileStorage.upload(
          buffer,
          filename,
          role.evaluation.evaluationFile.mimeType,
        );

        // Update evaluation with uploaded file URL
        role.evaluation.fileUrl = fileUrl;
        role.evaluation.fileName = role.evaluation.evaluationFile.originalName;
        role.evaluation.fileMimeType =
          role.evaluation.evaluationFile.mimeType;

        // Remove temporary field
        delete (role.evaluation as any).evaluationFile;
      }
    }

    // Agregar rol automático para Inversor si el proyecto lo requiere
    if (projectData.requiresInvestor) {
      rolesToCreate.push({
        title: 'Inversor',
        description: 'Buscamos inversores para financiar el proyecto',
        applicationTypes: [ApplicationType.CV],
      });
    }

    // Agregar rol automático para Socio si el proyecto lo requiere
    if (projectData.requiresPartner) {
      rolesToCreate.push({
        title: 'Socio',
        description: 'Buscamos socios estratégicos para el proyecto',
        applicationTypes: [ApplicationType.CV],
      });
    }

    // Crear roles (incluye validación previa de skills y tipos)
    await this.projectRepository.createProjectRoles(
      project.id,
      rolesToCreate as any,
    );

    // Obtener el proyecto con todas las relaciones
    const projectWithRelations =
      await this.projectRepository.findByIdWithRelations(project.id);

    if (!projectWithRelations) {
      throw new ProjectNotFoundException(project.id);
    }

    return projectWithRelations;
  }

  /**
   * Helper para obtener extensión de archivo desde MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
    };

    return mimeMap[mimeType] || 'jpg';
  }
}
