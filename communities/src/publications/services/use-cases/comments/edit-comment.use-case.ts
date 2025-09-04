import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateCommentDto } from '../../../dto/update-comment.dto';
import { CommentRepository } from '../../../repositories/comment.repository';
import { CommentWithUserDto } from '../../../response/enhanced-comments-paginated.dto';
import { UserInfoService } from '../../user-info.service';

@Injectable()
export class EditCommentUseCase {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly userInfoService: UserInfoService,
  ) {}

  async execute(
    id: number,
    userId: number,
    updateDto: UpdateCommentDto,
  ): Promise<CommentWithUserDto> {
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

    // Obtener la información del usuario
    const userInfoMap = await this.userInfoService.getUserInfoByIds([userId]);

    // Devolver el comentario enriquecido con datos de usuario
    return {
      id: updatedComment.id,
      content: updatedComment.content,
      userId: updatedComment.userId,
      user: userInfoMap[updatedComment.userId],
      publicationId: updatedComment.publicationId,
      createdAt: updatedComment.createdAt,
      updatedAt: updatedComment.updatedAt,
    };
  }
}
