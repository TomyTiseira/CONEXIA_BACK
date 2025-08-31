import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../common/services/users.service';

export interface OwnerInfo {
  id: number;
  name: string;
  profilePicture?: string;
  profession: string;
}

@Injectable()
export class OwnerHelperService {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Obtiene la información de los owners para una lista de publicaciones
   * @param publications Lista de publicaciones con userId
   * @returns Mapa con userId como clave y OwnerInfo como valor
   */
  async getOwnersInfo(
    publications: { userId: number }[],
  ): Promise<Map<number, OwnerInfo>> {
    // Obtener IDs únicos de usuarios
    const userIds = [...new Set(publications.map((pub) => pub.userId))];

    if (userIds.length === 0) {
      return new Map();
    }

    // Obtener información de los usuarios
    const owners = await this.usersService.getUsersByIds(userIds);

    // Crear un mapa para acceso rápido
    const ownersMap = new Map(owners.map((owner) => [owner.id, owner]));

    return ownersMap;
  }

  /**
   * Enrich una publicación con información del owner
   * @param publication Publicación a enriquecer
   * @param ownersMap Mapa de owners
   * @param currentUserId ID del usuario actual
   * @returns Publicación enriquecida con owner e isOwner
   */
  enrichPublicationWithOwner<T extends { userId: number }>(
    publication: T,
    ownersMap: Map<number, OwnerInfo>,
    currentUserId: number,
  ): T & { isOwner: boolean; owner: OwnerInfo } {
    const owner = ownersMap.get(publication.userId) || {
      id: publication.userId,
      name: undefined as unknown as string,
      profilePicture: undefined,
      profession: 'Sin profesión',
    };

    return {
      ...publication,
      isOwner: publication.userId === currentUserId,
      owner,
    };
  }

  /**
   * Enrich una lista de publicaciones con información de owners
   * @param publications Lista de publicaciones
   * @param currentUserId ID del usuario actual
   * @returns Lista de publicaciones enriquecidas
   */
  async enrichPublicationsWithOwners<T extends { userId: number }>(
    publications: T[],
    currentUserId: number,
  ): Promise<(T & { isOwner: boolean; owner: OwnerInfo })[]> {
    const ownersMap = await this.getOwnersInfo(publications);

    return publications.map((pub) =>
      this.enrichPublicationWithOwner(pub, ownersMap, currentUserId),
    );
  }
}
