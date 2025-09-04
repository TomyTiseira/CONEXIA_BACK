import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../common/services/users.service';
import { ConnectionStatusService } from './connection-status.service';
import { ContactHelperService } from './contact-helper.service';

export interface OwnerInfo {
  id: number;
  name: string;
  profilePicture?: string;
  profession: string;
}

@Injectable()
export class OwnerHelperService {
  constructor(
    private readonly usersService: UsersService,
    private readonly contactHelperService: ContactHelperService,
    private readonly connectionStatusService: ConnectionStatusService,
  ) {}

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
   * @param contactsMap Mapa de contactos (opcional)
   * @param connectionStatusMap Mapa de estados de conexión (opcional)
   * @returns Publicación enriquecida con owner, isOwner, isContact y connectionStatus
   */
  enrichPublicationWithOwner<T extends { userId: number }>(
    publication: T,
    ownersMap: Map<number, OwnerInfo>,
    currentUserId?: number,
    contactsMap?: Map<number, boolean>,
    connectionStatusMap?: Map<number, string | null>,
  ): T & {
    isOwner: boolean;
    isContact?: boolean;
    connectionStatus?: string | null;
    owner: OwnerInfo;
  } {
    const owner = ownersMap.get(publication.userId) || {
      id: publication.userId,
      name: undefined as unknown as string,
      profilePicture: undefined,
      profession: 'Sin profesión',
    };

    const isContact = contactsMap?.get(publication.userId) || false;
    const connectionStatus =
      connectionStatusMap?.get(publication.userId) || null;

    return {
      ...publication,
      isOwner:
        currentUserId !== undefined && publication.userId === currentUserId,
      isContact,
      connectionStatus,
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
    currentUserId?: number,
  ): Promise<
    (T & {
      isOwner: boolean;
      isContact?: boolean;
      connectionStatus?: string | null;
      owner: OwnerInfo;
    })[]
  > {
    const ownersMap = await this.getOwnersInfo(publications);

    // Obtener información de contactos si se proporciona currentUserId
    const userIds = [...new Set(publications.map((pub) => pub.userId))];

    // Si no hay currentUserId, no podemos determinar contactos
    let contactsMap: Map<number, boolean> | undefined;

    if (currentUserId !== undefined) {
      contactsMap = await this.contactHelperService.getContactsMap(
        currentUserId,
        userIds,
      );
    } else {
      // Si no hay currentUserId, crear un mapa vacío donde todos son false
      contactsMap = new Map(userIds.map((id) => [id, false]));
    }

    // Obtener estados de conexión
    let connectionStatusMap: Map<number, string | null> | undefined;

    if (currentUserId !== undefined) {
      connectionStatusMap =
        await this.connectionStatusService.getConnectionStatusMap(
          currentUserId,
          userIds,
        );
    } else {
      // Si no hay currentUserId, crear un mapa vacío donde todos son null
      connectionStatusMap = new Map(userIds.map((id) => [id, null]));
    }

    return publications.map((pub) =>
      this.enrichPublicationWithOwner(
        pub,
        ownersMap,
        currentUserId,
        contactsMap,
        connectionStatusMap,
      ),
    );
  }
}
