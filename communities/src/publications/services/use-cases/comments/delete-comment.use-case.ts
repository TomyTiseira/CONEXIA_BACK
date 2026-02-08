import { Injectable } from '@nestjs/common';
import {
  CommentNotFoundException,
  CommentNotOwnerException,
} from 'src/common/exceptions/comments.exceptions';
import { CommentRepository } from '../../../repositories/comment.repository';

@Injectable()
export class DeleteCommentUseCase {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(
    id: number,
    userId: number,
  ): Promise<{ success: boolean; message: string }> {
    const comment = await this.commentRepository.findActiveCommentById(id);

    if (!comment) {
      throw new CommentNotFoundException(id);
    }

    // Verificar que el usuario es el dueño del comentario
    if (comment.userId !== userId) {
      throw new CommentNotOwnerException();
    }

    // Eliminar lógicamente el comentario
    await this.commentRepository.softDelete(id);

    // Devolver respuesta de éxito
    return {
      success: true,
      message: 'comment deleted successfully',
    };
  }
}
