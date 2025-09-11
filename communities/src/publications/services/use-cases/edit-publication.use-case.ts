import { Injectable } from '@nestjs/common';
import {
  PublicationNotFoundException,
  PublicationNotOwnerException,
} from 'src/common/exceptions/publications.exceptions';
import { UpdatePublicationDto } from '../../dto/update-publication.dto';
import { Publication } from '../../entities/publication.entity';
import { PublicationRepository } from '../../repositories/publication.repository';

@Injectable()
export class EditPublicationUseCase {
  constructor(private readonly publicationRepository: PublicationRepository) {}

  async execute(
    id: number,
    userId: number,
    updateDto: Partial<UpdatePublicationDto>,
  ): Promise<Publication> {
    const publication =
      await this.publicationRepository.findActivePublicationById(id, userId);

    if (!publication) {
      throw new PublicationNotFoundException(id);
    }

    if (publication.userId !== userId) {
      throw new PublicationNotOwnerException();
    }

    // Manejar la eliminación de archivos adjuntos
    const dataToUpdate: Partial<UpdatePublicationDto> = { ...updateDto };

    // Si se solicita eliminar el archivo adjunto
    if (updateDto.removeMedia === true) {
      dataToUpdate.mediaUrl = '';
      dataToUpdate.mediaFilename = '';
      dataToUpdate.mediaSize = 0;
      dataToUpdate.mediaType = '';
      // Eliminar el campo removeMedia para que no se guarde en la base de datos
      delete dataToUpdate.removeMedia;
    } else if (updateDto.removeMedia === false) {
      // No eliminar, pero tampoco guardar el campo en la base de datos
      delete dataToUpdate.removeMedia;
    }

    await this.publicationRepository.updatePublication(id, dataToUpdate);
    const updated = await this.publicationRepository.findActivePublicationById(
      id,
      userId,
    );

    if (!updated) {
      throw new PublicationNotFoundException(id);
    }

    return updated;
  }
}
