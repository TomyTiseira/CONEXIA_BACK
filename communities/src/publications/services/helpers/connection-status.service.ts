import { Injectable } from '@nestjs/common';
import { ConnectionStatus } from '../../../contacts/entities/connection.entity';
import { ConnectionRepository } from '../../../contacts/repositories/connection.repository';

@Injectable()
export class ConnectionStatusService {
  constructor(private readonly connectionRepository: ConnectionRepository) {}

  /**
   * Obtiene el estado de conexión entre dos usuarios
   * @param userId1 ID del primer usuario
   * @param userId2 ID del segundo usuario
   * @returns El estado de conexión o null si no existe conexión
   */
  async getConnectionStatus(
    userId1: number,
    userId2: number,
  ): Promise<ConnectionStatus | null> {
    if (userId1 === userId2) {
      return ConnectionStatus.ACCEPTED; // Un usuario siempre está "conectado" consigo mismo
    }

    try {
      // Buscar conexión en una dirección
      const connection =
        await this.connectionRepository.findBySenderAndReceiver(
          userId1,
          userId2,
        );
      if (connection) {
        return connection.status;
      }

      // Buscar conexión en la dirección opuesta
      const reverseConnection =
        await this.connectionRepository.findBySenderAndReceiver(
          userId2,
          userId1,
        );
      if (reverseConnection) {
        return reverseConnection.status;
      }

      return null; // No hay conexión entre los usuarios
    } catch {
      return null;
    }
  }

  /**
   * Obtiene el estado de conexión para múltiples usuarios
   * @param currentUserId ID del usuario actual
   * @param userIds Lista de IDs de usuarios
   * @returns Mapa con userId como clave y ConnectionStatus como valor
   */
  async getConnectionStatusMap(
    currentUserId: number,
    userIds: number[],
  ): Promise<Map<number, ConnectionStatus | null>> {
    const statusMap = new Map<number, ConnectionStatus | null>();

    // Procesar en paralelo para mejor rendimiento
    const promises = userIds.map(async (userId) => {
      const status = await this.getConnectionStatus(currentUserId, userId);
      return { userId, status };
    });

    const results = await Promise.all(promises);

    results.forEach(({ userId, status }) => {
      // Simplemente asignar el status, que puede ser ConnectionStatus o null
      statusMap.set(userId, status ?? null);
    });

    return statusMap;
  }
}
