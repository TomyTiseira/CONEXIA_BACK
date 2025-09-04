import { Injectable } from '@nestjs/common';
import { PublicationNotFoundException } from 'src/common/exceptions/publications.exceptions';
import { Publication } from '../../entities/publication.entity';
import { PublicationRepository } from '../../repositories/publication.repository';
import { ConnectionStatusService } from '../helpers/connection-status.service';
import { ContactHelperService } from '../helpers/contact-helper.service';

@Injectable()
export class GetPublicationByIdUseCase {
  constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly contactHelperService: ContactHelperService,
    private readonly connectionStatusService: ConnectionStatusService,
  ) {}

  async execute(
    id: number,
    currentUserId?: number,
  ): Promise<
    Publication & {
      isOwner?: boolean;
      isContact?: boolean;
      connectionStatus?: string | null;
    }
  > {
    const publication =
      await this.publicationRepository.findActivePublicationById(
        id,
        currentUserId,
      );

    if (!publication) {
      throw new PublicationNotFoundException(id);
    }

    // Si se proporciona currentUserId, agregar información de si es el propietario, si es contacto y estado de conexión
    if (currentUserId !== undefined) {
      const isContact = await this.contactHelperService.areContacts(
        currentUserId,
        publication.userId,
      );

      const connectionStatus =
        await this.connectionStatusService.getConnectionStatus(
          currentUserId,
          publication.userId,
        );

      return {
        ...publication,
        isOwner: publication.userId === currentUserId,
        isContact,
        connectionStatus,
      };
    }

    return publication;
  }
}
