import { Injectable } from '@nestjs/common';
import { GetInternalUsersDto } from 'src/internal-users/dto/get-internal-users.dto';
import { InternalUserRepository } from '../../repository/internal-user.repository';

@Injectable()
export class GetInternalUserUseCases {
  constructor(
    private readonly internalUserRepository: InternalUserRepository,
  ) {}

  async execute(getInternalUsersDto: GetInternalUsersDto) {
    const params = {
      ...getInternalUsersDto,
      page: getInternalUsersDto.page || 1,
      limit: getInternalUsersDto.limit || 10,
    };
    const [users, total] =
      await this.internalUserRepository.findAllInternalUsers(params);

    // Calcular información de paginación
    const totalNumber = typeof total === 'number' ? total : Number(total);
    const limitNumber =
      typeof params.limit === 'number' ? params.limit : Number(params.limit);
    const pageNumber =
      typeof params.page === 'number' ? params.page : Number(params.page);

    const totalPages = Math.ceil(totalNumber / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPreviousPage = pageNumber > 1;
    const currentPage = pageNumber;
    const itemsPerPage = limitNumber;
    const totalItems = total;

    return {
      users,
      pagination: {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        nextPage: hasNextPage ? currentPage + 1 : null,
        previousPage: hasPreviousPage ? currentPage - 1 : null,
      },
    };
  }
}
