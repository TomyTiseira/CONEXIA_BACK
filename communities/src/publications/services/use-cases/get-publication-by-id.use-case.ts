import { Injectable } from '@nestjs/common';
import { PublicationNotFoundException } from 'src/common/exceptions/publications.exceptions';
import { Publication } from '../../entities/publication.entity';
import { PublicationRepository } from '../../repositories/publication.repository';
import { ContactHelperService } from '../helpers/contact-helper.service';

@Injectable()
export class GetPublicationByIdUseCase {
  constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly contactHelperService: ContactHelperService,
  ) {}

  async execute(
    id: number,
    currentUserId?: number,
  ): Promise<Publication & { isOwner?: boolean; isContact?: boolean }> {
    const publication =
      await this.publicationRepository.findActivePublicationById(id);

    if (!publication) {
      throw new PublicationNotFoundException(id);
    }

    // Si se proporciona currentUserId, agregar información de si es el propietario y si es contacto
    if (currentUserId !== undefined) {
      const isContact = await this.contactHelperService.areContacts(
        currentUserId,
        publication.userId,
      );

      return {
        ...publication,
        isOwner: publication.userId === currentUserId,
        isContact,
      };
    }

    return publication;
  }
}
