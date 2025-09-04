import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    // Verificar que el usuario es el dueño del comentario
    if (comment.userId !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to delete this comment',
      );
    }

    // Eliminar lógicamente el comentario
    await this.commentRepository.softDelete(id);

    // Devolver respuesta de éxito
    return {
      success: true,
      message: 'Comentario eliminado correctamente',
    };
  }
}
