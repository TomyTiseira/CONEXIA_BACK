import { Injectable } from '@nestjs/common';
import { MembershipsClientService } from '../../../common/services/memberships-client.service';
import {
  PaginationInfo,
  calculatePagination,
} from '../../../common/utils/pagination.utils';
import { User } from '../../../shared/entities/user.entity';
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
  constructor(
    private readonly userRepository: UserRepository,
    private readonly membershipsClientService: MembershipsClientService,
  ) {}

  async execute(searchParams: SearchUsersDto): Promise<SearchUsersResult> {
    const { search, page = 1, limit = 10, currentUserId } = searchParams;

    // Obtener TODOS los usuarios que coinciden con la búsqueda (sin paginación inicial)
    const { users: allUsers, total } =
      await this.userRepository.searchUsersPaginated(search || '', 10000, 0, currentUserId);

    // Obtener search_visibility de todos los usuarios desde memberships
    const userIds = allUsers.map((user) => user.id);
    const visibilityMap =
      await this.membershipsClientService.getUsersSearchVisibility(userIds);

    // Ordenar usuarios por search_visibility (prioridad del plan)
    const sortedUsers = this.sortUsersBySearchVisibility(
      allUsers,
      visibilityMap,
    );

    // Aplicar paginación sobre los usuarios ya ordenados
    const offset = (page - 1) * limit;
    const paginatedUsers = sortedUsers.slice(offset, offset + limit);

    // Calcular información de paginación
    const pagination = calculatePagination(total, { page, limit });

    // Mapear usuarios al formato de respuesta
    const mappedUsers = paginatedUsers.map((user) => ({
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

  /**
   * Ordena usuarios por search_visibility (prioridad del plan)
   * Orden: prioridad_maxima > alta > estandar > sin valor
   */
  private sortUsersBySearchVisibility(
    users: User[],
    visibilityMap: Map<number, string>,
  ): User[] {
    const visibilityPriority: Record<string, number> = {
      prioridad_maxima: 3,
      alta: 2,
      estandar: 1,
    };

    return users.sort((a, b) => {
      const visibilityA = visibilityMap.get(a.id);
      const visibilityB = visibilityMap.get(b.id);

      const priorityA = visibilityA ? visibilityPriority[visibilityA] || 0 : 0;
      const priorityB = visibilityB ? visibilityPriority[visibilityB] || 0 : 0;

      // Ordenar de mayor a menor prioridad
      if (priorityB !== priorityA) {
        return priorityB - priorityA;
      }

      // Si tienen la misma prioridad, ordenar por fecha de creación (más reciente primero)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
}
