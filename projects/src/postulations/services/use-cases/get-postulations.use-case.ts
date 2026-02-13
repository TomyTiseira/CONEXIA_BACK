import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ProjectAccessForbiddenException } from '../../../common/exceptions/postulation.exceptions';
import { ProjectNotFoundException } from '../../../common/exceptions/project.exceptions';
import { calculatePagination } from '../../../common/utils/pagination.utils';
import { ProjectsService } from '../../../projects/services/projects.service';
import { GetPostulationsDto } from '../../dtos/get-postulations.dto';
import { PostulationRepository } from '../../repositories/postulation.repository';
import { GetPostulationsResponseDto } from '../../response/get-postulations-response.dto';
import { PostulationTransformService } from '../postulation-transform.service';

@Injectable()
export class GetPostulationsUseCase {
  constructor(
    private readonly postulationRepository: PostulationRepository,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
    private readonly postulationTransformService: PostulationTransformService,
  ) {}

  async execute(
    getPostulationsDto: GetPostulationsDto,
    currentUserId: number,
  ): Promise<GetPostulationsResponseDto> {
    const {
      projectId,
      statusId,
      roleId,
      page = 1,
      limit = 10,
    } = getPostulationsDto;

    // Verificar que el usuario sea el dueño del proyecto
    const project = await this.projectsService.getProjectById({
      id: projectId,
      currentUserId,
    });
    if (!project) {
      throw new ProjectNotFoundException(projectId);
    }

    if (project.ownerId !== currentUserId) {
      throw new ProjectAccessForbiddenException(projectId, currentUserId);
    }

    // Construir el where clause
    const whereClause: any = { projectId };

    if (statusId) {
      whereClause.statusId = statusId;
    }

    if (roleId) {
      whereClause.roleId = roleId;
    }

    // Obtener postulaciones con paginación y ordenamiento especial
    const [postulations, total] =
      await this.postulationRepository.findAndCountWithFilters(
        whereClause,
        page,
        limit,
      );

    // Calcular información de paginación
    const pagination = calculatePagination(total, { page, limit });

    // Transformar las postulaciones a DTOs de respuesta
    const transformedPostulations =
      this.postulationTransformService.transformManyToResponseDto(postulations);

    // Mapear los roles del proyecto
    const roles = (project.roles || []).map((role) => ({
      id: role.id,
      title: role.title,
    }));

    return {
      postulations: transformedPostulations,
      roles,
      pagination,
    };
  }
}
