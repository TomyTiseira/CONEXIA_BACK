import { Injectable } from '@nestjs/common';
import { ConnectionStatus } from '../../../contacts/entities/connection.entity';
import { ConnectionRepository } from '../../../contacts/repositories/connection.repository';

@Injectable()
export class ContactHelperService {
  constructor(private readonly connectionRepository: ConnectionRepository) {}

  /**
   * Verifica si dos usuarios son contactos (tienen una conexión aceptada)
   * @param userId1 ID del primer usuario
   * @param userId2 ID del segundo usuario
   * @returns true si son contactos, false en caso contrario
   */
  async areContacts(userId1: number, userId2: number): Promise<boolean> {
    if (userId1 === userId2) {
      return true; // Un usuario es contacto de sí mismo
    }

    try {
      // Buscar conexión aceptada en cualquier dirección
      const connection =
        await this.connectionRepository.findBySenderAndReceiver(
          userId1,
          userId2,
        );

      if (!connection) {
        // Buscar en la dirección opuesta
        const reverseConnection =
          await this.connectionRepository.findBySenderAndReceiver(
            userId2,
            userId1,
          );
        return reverseConnection?.status === ConnectionStatus.ACCEPTED;
      }

      return connection.status === ConnectionStatus.ACCEPTED;
    } catch {
      return false;
    }
  }

  /**
   * Verifica si múltiples usuarios son contactos de un usuario específico
   * @param currentUserId ID del usuario actual
   * @param userIds Lista de IDs de usuarios a verificar
   * @returns Mapa con userId como clave y boolean como valor
   */
  async getContactsMap(
    currentUserId: number,
    userIds: number[],
  ): Promise<Map<number, boolean>> {
    const contactsMap = new Map<number, boolean>();

    // Procesar en paralelo para mejor rendimiento
    const promises = userIds.map(async (userId) => {
      const areContacts = await this.areContacts(currentUserId, userId);
      return { userId, areContacts };
    });

    const results = await Promise.allSettled(promises);

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        contactsMap.set(result.value.userId, result.value.areContacts);
      } else {
        contactsMap.set(result.reason.userId || 0, false);
      }
    });

    return contactsMap;
  }
}
