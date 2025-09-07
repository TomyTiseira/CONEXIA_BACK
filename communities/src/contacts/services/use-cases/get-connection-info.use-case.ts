import { Injectable } from '@nestjs/common';
import { ConnectionStatus } from '../../entities/connection.entity';
import { ConnectionRepository } from '../../repositories/connection.repository';

export interface ConnectionInfo {
  id: number;
  state: ConnectionStatus;
  senderId: number;
}

@Injectable()
export class GetConnectionInfoUseCase {
  constructor(private readonly connectionRepository: ConnectionRepository) {}

  async execute(
    userId1: number,
    userId2: number,
  ): Promise<ConnectionInfo | null> {
    if (userId1 === userId2) {
      return null; // Un usuario siempre está "conectado" consigo mismo
    }

    try {
      // Buscar conexión en una dirección
      const connection =
        await this.connectionRepository.findBySenderAndReceiver(
          userId1,
          userId2,
        );
      if (connection) {
        return {
          id: connection.id,
          state: connection.status,
          senderId: connection.senderId,
        };
      }

      // Buscar conexión en la dirección opuesta
      const reverseConnection =
        await this.connectionRepository.findBySenderAndReceiver(
          userId2,
          userId1,
        );
      if (reverseConnection) {
        return {
          id: reverseConnection.id,
          state: reverseConnection.status,
          senderId: reverseConnection.senderId,
        };
      }

      return null; // No hay conexión entre los usuarios
    } catch {
      return null;
    }
  }
}
