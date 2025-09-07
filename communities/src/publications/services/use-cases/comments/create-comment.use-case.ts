import { Injectable } from '@nestjs/common';
import { CommentUserIdMismatchException } from 'src/common/exceptions/comments.exceptions';
import { PublicationNotFoundException } from 'src/common/exceptions/publications.exceptions';
import { CreateCommentDto } from '../../../dto/create-comment.dto';
import { PublicationComment } from '../../../entities/publication-comment.entity';
import { CommentRepository } from '../../../repositories/comment.repository';
import { PublicationRepository } from '../../../repositories/publication.repository';

@Injectable()
export class CreateCommentUseCase {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly publicationRepository: PublicationRepository,
  ) {}

  async execute(
    data: CreateCommentDto,
    userId: number,
  ): Promise<PublicationComment> {
    // Verificar que la publicación existe y el usuario tiene acceso a ella
    const publication =
      await this.publicationRepository.findActivePublicationById(
        data.publicationId,
        userId,
      );

    if (!publication) {
      throw new PublicationNotFoundException(data.publicationId);
    }

    // Verificar que el usuario es el mismo que el que viene en el DTO
    if (userId !== data.userId) {
      throw new CommentUserIdMismatchException();
    }

    // Crear el comentario
    const comment = this.commentRepository.create({
      content: data.content,
      userId: data.userId,
      publicationId: data.publicationId,
    });

    return await this.commentRepository.save(comment);
  }
}
