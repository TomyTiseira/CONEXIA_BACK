import { Injectable } from '@nestjs/common';
import { calculatePagination } from '../../../common/utils/pagination.utils';
import { GetUserPublicationsDto } from '../../dto/get-user-publications.dto';
import { PublicationRepository } from '../../repositories/publication.repository';
import { PublicationWithOwnerDto } from '../../response/publication-with-owner.dto';
import { PublicationsPaginatedDto } from '../../response/publications-paginated.dto';
import { OwnerHelperService } from '../helpers/owner-helper.service';

@Injectable()
export class GetUserPublicationsUseCase {
  constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly ownerHelperService: OwnerHelperService,
  ) {}

  async execute(
    data: GetUserPublicationsDto,
  ): Promise<PublicationsPaginatedDto> {
    // Configurar parámetros de paginación
    const params = {
      page: data.page || 1,
      limit: data.limit || 10,
    };

    // Obtener publicaciones del usuario con paginación y filtrado por privacidad
    const [publications, total] =
      await this.publicationRepository.findPublicationsByUserPaginated(
        data.userId,
        params.page,
        params.limit,
        data.currentUserId,
      );

    // Enriquecer publicaciones con información del owner
    const enrichedPublications =
      (await this.ownerHelperService.enrichPublicationsWithOwners(
        publications,
        data.userId,
      )) as PublicationWithOwnerDto[];

    // Calcular información de paginación
    const pagination = calculatePagination(total, params);

    return {
      publications: enrichedPublications,
      pagination,
    };
  }
}
