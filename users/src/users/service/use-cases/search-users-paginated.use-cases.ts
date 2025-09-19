import { Injectable } from '@nestjs/common';
import {
  PaginationInfo,
  calculatePagination,
} from '../../../common/utils/pagination.utils';
import { SearchUsersDto } from '../../dto/search-users.dto';
import { UserRepository } from '../../repository/users.repository';

export interface SearchUsersResult {
  users: Array<{
    id: number;
    name: string;
    lastName: string;
    email: string;
    profilePicture: string;
    coverPicture: string;
    profession: string;
  }>;
  pagination: PaginationInfo;
}

@Injectable()
export class SearchUsersPaginatedUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(searchParams: SearchUsersDto): Promise<SearchUsersResult> {
    const { search, page = 1, limit = 10 } = searchParams;

    // Calcular offset para la paginación
    const offset = (page - 1) * limit;

    // Obtener usuarios con paginación
    const { users, total } = await this.userRepository.searchUsersPaginated(
      search || '',
      limit,
      offset,
    );

    // Calcular información de paginación
    const pagination = calculatePagination(total, { page, limit });

    // Mapear usuarios al formato de respuesta
    const mappedUsers = users.map((user) => ({
      id: user.id,
      name: user.profile?.name || '',
      lastName: user.profile?.lastName || '',
      email: user.email,
      profilePicture: user.profile?.profilePicture || '',
      coverPicture: user.profile?.coverPicture || '',
      profession: user.profile?.profession || '',
    }));

    return {
      users: mappedUsers,
      pagination,
    };
  }
}
