import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateCommentDto } from '../../../dto/update-comment.dto';
import { PublicationComment } from '../../../entities/publication-comment.entity';
import { CommentRepository } from '../../../repositories/comment.repository';

@Injectable()
export class EditCommentUseCase {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(
    id: number,
    userId: number,
    updateDto: UpdateCommentDto,
  ): Promise<PublicationComment> {
    const comment = await this.commentRepository.findActiveCommentById(id);

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    // Verificar que el usuario es el dueño del comentario
    if (comment.userId !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to edit this comment',
      );
    }

    // Actualizar el comentario
    await this.commentRepository.update(id, { content: updateDto.content });

    const updatedComment =
      await this.commentRepository.findActiveCommentById(id);

    if (!updatedComment) {
      throw new NotFoundException(
        `Comment with ID ${id} not found after update`,
      );
    }

    return updatedComment;
  }
}
