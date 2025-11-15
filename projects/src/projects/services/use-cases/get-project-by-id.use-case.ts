/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
    ProjectAlreadyDeletedException,
    ProjectNotFoundException,
    UserNotFoundException,
} from '../../../common/exceptions/project.exceptions';
import { UsersClientService } from '../../../common/services/users-client.service';
import {
    createSkillsMap,
    getProjectSkillNames,
    transformProjectToDetailResponse,
} from '../../../common/utils/project-detail-transform.utils';
import { PostulationRepository } from '../../../postulations/repositories/postulation.repository';
import { ReportRepository } from '../../../reports/repositories/report.repository';
import { GetProjectByIdDto } from '../../dtos/get-project-by-id.dto';
import { ProjectRepository } from '../../repositories/project.repository';
import { ProjectDetailResponse } from '../../response/project-detail-response';

@Injectable()
export class GetProjectByIdUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly usersClientService: UsersClientService,
    @Inject(forwardRef(() => PostulationRepository))
    private readonly postulationRepository: PostulationRepository,
    @Inject(forwardRef(() => ReportRepository))
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute(data: GetProjectByIdDto): Promise<ProjectDetailResponse> {
    // Obtener el proyecto con todas las relaciones, SIN incluir eliminados
    const project = await this.projectRepository.findByIdWithRelations(
      data.id,
      false,
    );

    if (!project) {
      throw new ProjectNotFoundException(data.id);
    }

    // Verificar si el proyecto está eliminado
    if (project.deletedAt) {
      throw new ProjectAlreadyDeletedException(data.id);
    }

    // Verificar si el usuario actual es el dueño del proyecto (ahora se calcula en la función utilitaria)

    // Obtener información del dueño y su perfil en una sola consulta
    const ownerData = await this.usersClientService.getUserWithProfile(
      project.userId,
    );
    if (!ownerData) {
      throw new UserNotFoundException(project.userId);
    }

    // Obtener información de la localidad si existe
    let locationName: string | undefined;
    if (project.locationId) {
      const locality = await this.usersClientService.getLocalityById(
        project.locationId,
      );
      locationName = locality?.name;
    }

    // Obtener información de las habilidades por proyecto (mapa id->name)
    const projectSkills = await this.projectRepository.getProjectSkills(
      project.id,
    );
    const skills = await this.usersClientService.getSkillsByIds(projectSkills);
    const skillsMap = createSkillsMap(skills);

    // (isApplied removed from detail response by request)

    // Verificar si el usuario actual ya reportó este proyecto
    let hasReported = false;
    if (data.currentUserId) {
      // Si es el dueño del proyecto, no puede reportarlo
      if (project.userId === data.currentUserId) {
        hasReported = false;
      } else {
        const report = await this.reportRepository.findByProjectAndReporter(
          project.id,
          data.currentUserId,
        );
        hasReported = report !== null;
      }
    }

    // Calcular cantidad de postulaciones aprobadas para este proyecto
    const statusAccepted = 2; // Ajusta este valor si el ID de estado "aprobada" es diferente
    const [, approvedCount] =
      await this.postulationRepository.findAndCountWithFilters(
        { projectId: project.id, statusId: statusAccepted },
        1,
        1,
      );

    // Construir la respuesta usando la función utilitaria
    const response = transformProjectToDetailResponse(
      project,
      ownerData,
      skillsMap,
      data.currentUserId,
      locationName,
      approvedCount,
    );

    // Agregar el campo hasReported a la respuesta
    response.hasReported = hasReported;

    return response;
  }
}
