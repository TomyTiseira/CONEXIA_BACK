import { Injectable, Logger } from '@nestjs/common';
import { ConnectionRepository } from '../../repositories/connection.repository';

@Injectable()
export class DeleteUserConnectionsOnBanUseCase {
  private readonly logger = new Logger(DeleteUserConnectionsOnBanUseCase.name);

  constructor(private readonly connectionRepository: ConnectionRepository) {}

  /**
   * Elimina todas las conexiones de un usuario cuando es baneado
   * @param userId ID del usuario baneado
   * @returns Número de conexiones eliminadas
   */
  async execute(userId: number): Promise<number> {
    this.logger.log(
      `Eliminando todas las conexiones del usuario baneado ${userId}...`,
    );

    try {
      // Contar conexiones antes de eliminar (para auditoría)
      const connectionCount =
        await this.connectionRepository.countUserConnections(userId);

      if (connectionCount === 0) {
        this.logger.log(`Usuario ${userId} no tiene conexiones para eliminar`);
        return 0;
      }

      // Eliminar todas las conexiones del usuario
      const deletedCount =
        await this.connectionRepository.deleteAllUserConnections(userId);

      this.logger.log(
        `Se eliminaron ${deletedCount} conexiones del usuario ${userId}`,
      );

      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Error al eliminar conexiones del usuario ${userId}:`,
        error.stack,
      );
      throw error;
    }
  }
}
