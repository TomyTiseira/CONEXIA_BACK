import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { USERS_SERVICE } from '../../config';
import { UserInfoDto } from '../response/user-info.dto';

// Interfaz para la respuesta del servicio de usuarios
interface UserResponse {
  id: number;
  profile?: {
    name?: string;
    lastName?: string;
    profession?: string;
    profilePicture?: string;
  };
  connectionLevel?: number;
}

@Injectable()
export class UserInfoService {
  constructor(@Inject(USERS_SERVICE) private readonly client: ClientProxy) {}

  /**
   * Obtiene información detallada de varios usuarios por sus IDs
   * @param userIds Array de IDs de usuarios
   * @returns Objeto mapeado de ID de usuario a información de usuario
   */
  async getUserInfoByIds(
    userIds: number[],
  ): Promise<Record<number, UserInfoDto>> {
    if (!userIds || userIds.length === 0) {
      return {};
    }

    // Eliminar duplicados
    const uniqueIds = [...new Set(userIds)];

    // Llamar al microservicio de usuarios para obtener los detalles
    const users = await lastValueFrom<UserResponse[]>(
      this.client.send('findUsersByIds', { ids: uniqueIds }),
    );

    // Mapear los resultados por ID para un acceso más rápido
    const userInfoMap: Record<number, UserInfoDto> = {};

    for (const user of users) {
      // Construir un nombre apropiado incluso si profile.name o profile.lastName son undefined
      const firstName = user.profile?.name || 'Usuario';
      const lastName = user.profile?.lastName || '';
      const fullName = firstName + (lastName ? ` ${lastName}` : '');

      userInfoMap[user.id] = {
        id: user.id,
        name: fullName,
        profilePicture: user.profile?.profilePicture || '/default-profile.jpg',
        profession: user.profile?.profession || 'Usuario de CONEXIA',
        profileUrl: `/profile/userProfile/${user.id}`,
        position: this.determinePosition(user), // Lógica para determinar la posición de conexión
      };
    }

    return userInfoMap;
  }

  /**
   * Determina la posición o nivel de conexión del usuario
   *
   * En LinkedIn, esto representa el grado de conexión:
   * - 1º: Conexión directa (están conectados)
   * - 2º: Conexión de segundo grado (tienen un contacto en común)
   * - 3º+: Conexión de tercer grado o más lejana
   *
   * Este campo puede omitirse en la UI si no es relevante para tu implementación
   */
  private determinePosition(user: UserResponse): string {
    if (!user || !user.connectionLevel) return '';

    // Si hay un nivel de conexión definido, formatearlo correctamente
    if (user.connectionLevel === 1) return '1º';
    if (user.connectionLevel === 2) return '2º';
    if (user.connectionLevel >= 3) return '3º+';

    return '';
  }
}
