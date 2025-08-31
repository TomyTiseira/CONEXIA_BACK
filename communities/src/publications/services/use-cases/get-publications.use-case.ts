import { Injectable } from '@nestjs/common';
import { calculatePagination } from '../../../common/utils/pagination.utils';
import { GetPublicationsDto } from '../../dto/get-publications.dto';
import { PublicationRepository } from '../../repositories/publication.repository';
import { PublicationWithOwnerDto } from '../../response/publication-with-owner.dto';
import { PublicationsPaginatedDto } from '../../response/publications-paginated.dto';
import { OwnerHelperService } from '../helpers/owner-helper.service';

@Injectable()
export class GetPublicationsUseCase {
  constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly ownerHelperService: OwnerHelperService,
  ) {}

  async execute(data: GetPublicationsDto): Promise<PublicationsPaginatedDto> {
    // Configurar parámetros de paginación
    const params = {
      page: data.page || 1,
      limit: data.limit || 10,
    };

    // Obtener publicaciones con paginación
    const [publications, total] =
      await this.publicationRepository.findActivePublicationsPaginated(
        params.page,
        params.limit,
      );

    // Enriquecer publicaciones con información del owner
    const enrichedPublications =
      (await this.ownerHelperService.enrichPublicationsWithOwners(
        publications,
        data.currentUserId,
      )) as PublicationWithOwnerDto[];

    // Calcular información de paginación
    const pagination = calculatePagination(total, params);

    return {
      publications: enrichedPublications,
      pagination,
    };
  }
}
