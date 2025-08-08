/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import {
  ProjectNotFoundException,
  UserNotFoundException,
} from '../../../common/exceptions/project.exceptions';
import {
  createSkillsMap,
  getProjectSkillNames,
  transformProjectToDetailResponse,
} from '../../../common/utils/project-detail-transform.utils';
import { GetProjectByIdDto } from '../../dtos/get-project-by-id.dto';
import { ProjectRepository } from '../../repositories/project.repository';
import { ProjectDetailResponse } from '../../response/project-detail-response';
import { UsersClientService } from '../users-client.service';

@Injectable()
export class GetProjectByIdUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly usersClientService: UsersClientService,
  ) {}

  async execute(data: GetProjectByIdDto): Promise<ProjectDetailResponse> {
    // Obtener el proyecto con todas las relaciones
    const project = await this.projectRepository.findByIdWithRelations(data.id);

    if (!project) {
      throw new ProjectNotFoundException(data.id);
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

    // Obtener información de las habilidades
    const projectSkills = await this.projectRepository.getProjectSkills(
      project.id,
    );
    const skills = await this.usersClientService.getSkillsByIds(projectSkills);
    const skillsMap = createSkillsMap(skills);
    const skillNames = getProjectSkillNames(project, skillsMap);

    // Construir la respuesta usando la función utilitaria
    const response = transformProjectToDetailResponse(
      project,
      ownerData,
      skillNames,
      data.currentUserId,
      locationName,
    );

    return response;
  }
}
