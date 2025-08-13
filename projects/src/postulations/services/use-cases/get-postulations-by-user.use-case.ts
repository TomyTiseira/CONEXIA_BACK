import { Injectable } from '@nestjs/common';
import { calculatePagination } from 'src/common/utils/pagination.utils';
import { GetPostulationsByUserDto } from '../../dtos/get-postulations-by-user.dto';
import { PostulationRepository } from '../../repositories/postulation.repository';
import { GetPostulationsByUserResponseDto } from '../../response/get-postulations-by-user-response.dto';
import { PostulationTransformService } from '../postulation-transform.service';

@Injectable()
export class GetPostulationsByUserUseCase {
  constructor(
    private readonly postulationRepository: PostulationRepository,
    private readonly postulationTransformService: PostulationTransformService,
  ) {}

  async execute(
    getPostulationsByUserDto: GetPostulationsByUserDto,
  ): Promise<GetPostulationsByUserResponseDto> {
    const { userId, page = 1, limit = 10 } = getPostulationsByUserDto;

    // Obtener postulaciones del usuario con paginado
    const [postulations, total] =
      await this.postulationRepository.findByUserWithState(userId, page, limit);

    // Transformar a DTOs de respuesta
    const postulationDtos =
      this.postulationTransformService.transformManyToResponseDto(postulations);

    const pagination = calculatePagination(total, { page, limit });

    return {
      postulations: postulationDtos,
      pagination,
    };
  }
}
