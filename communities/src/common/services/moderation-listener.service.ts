import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Publication } from '../../publications/entities/publication.entity';

/**
 * Servicio que escucha eventos de moderación (baneo/suspensión/reactivación)
 * y actualiza el campo ownerModerationStatus de las publicaciones
 */
@Injectable()
export class ModerationListenerService {
  private readonly logger = new Logger(ModerationListenerService.name);

  constructor(
    @InjectRepository(Publication)
    private readonly publicationRepository: Repository<Publication>,
  ) {}

  /**
   * Procesa el evento de usuario baneado
   * Marca todas sus publicaciones con ownerModerationStatus = 'banned'
   */
  async handleUserBanned(userId: number, moderationStatus: string) {
    this.logger.log(`Procesando baneo de usuario ${userId}`);

    try {
      // Actualizar ownerModerationStatus de todas las publicaciones
      const result = await this.publicationRepository.update(
        {
          userId,
          isActive: true, // Solo publicaciones activas
        },
        {
          ownerModerationStatus: moderationStatus,
        },
      );

      this.logger.log(
        `${result.affected} publicaciones marcadas como owner baneado (userId=${userId})`,
      );
    } catch (error) {
      this.logger.error(`Error procesando baneo de usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Procesa el evento de usuario suspendido
   * Marca todas sus publicaciones con ownerModerationStatus = 'suspended'
   */
  async handleUserSuspended(userId: number) {
    this.logger.log(`Procesando suspensión de usuario ${userId}`);

    try {
      const result = await this.publicationRepository.update(
        {
          userId,
          isActive: true,
        },
        {
          ownerModerationStatus: 'suspended',
        },
      );

      this.logger.log(
        `${result.affected} publicaciones marcadas como owner suspendido (userId=${userId})`,
      );
    } catch (error) {
      this.logger.error(
        `Error procesando suspensión de usuario ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Procesa el evento de usuario reactivado
   * Limpia ownerModerationStatus de sus publicaciones
   */
  async handleUserReactivated(userId: number) {
    this.logger.log(`Procesando reactivación de usuario ${userId}`);

    try {
      // Solo restaurar publicaciones que fueron marcadas como suspended
      // NO restaurar las que fueron marcadas como banned
      const result = await this.publicationRepository.update(
        {
          userId,
          ownerModerationStatus: 'suspended',
        },
        {
          ownerModerationStatus: null, // Limpiar el flag
        },
      );

      this.logger.log(
        `${result.affected} publicaciones restauradas para usuario ${userId}`,
      );
      this.logger.log(`Reactivación completada para usuario ${userId}`);
    } catch (error) {
      this.logger.error(
        `Error procesando reactivación de usuario ${userId}:`,
        error,
      );
      throw error;
    }
  }
}
