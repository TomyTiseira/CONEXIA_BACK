import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateCommentDto,
  CreatePublicationDto,
  CreateReactionDto,
  DeleteCommentDto,
  DeletePublicationDto,
  DeleteReactionDto,
  EditPublicationSimpleDto,
  EditReactionDto,
  GetPublicationByIdDto,
  GetPublicationCommentsDto,
  GetPublicationReactionsDto,
  GetPublicationsDto,
  GetUserPublicationsDto,
  UpdateCommentDto,
} from '../dto';
import { PublicationsService } from '../services/publications.service';

@Controller()
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  @MessagePattern('ping')
  ping() {
    return this.publicationsService.ping();
  }

  @MessagePattern('createPublication')
  createPublication(@Payload() data: CreatePublicationDto) {
    return this.publicationsService.createPublication(data, data.userId);
  }

  @MessagePattern('editPublication')
  editPublication(@Payload() data: EditPublicationSimpleDto) {
    return this.publicationsService.editPublication(
      data.id,
      data.userId,
      data.updatePublicationDto,
    );
  }

  @MessagePattern('getUserPublications')
  getUserPublications(@Payload() data: GetUserPublicationsDto) {
    return this.publicationsService.getUserPublications(data);
  }

  @MessagePattern('getPublications')
  getPublications(@Payload() data: GetPublicationsDto) {
    return this.publicationsService.getPublications(data);
  }

  @MessagePattern('getPublicationById')
  getPublicationById(@Payload() data: GetPublicationByIdDto) {
    return this.publicationsService.getPublicationById(
      data.id,
      data.currentUserId,
    );
  }

  @MessagePattern('deletePublication')
  async deletePublication(@Payload() data: DeletePublicationDto) {
    try {
      await this.publicationsService.deletePublication(data.id, data.userId);
      return {
        id: data.id,
        message: 'Publication deleted successfully.',
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // Endpoints para comentarios
  @MessagePattern('createComment')
  createComment(@Payload() data: CreateCommentDto) {
    return this.publicationsService.createComment(data, data.userId);
  }

  @MessagePattern('editComment')
  editComment(
    @Payload()
    data: {
      id: number;
      userId: number;
      content?: string;
      updateCommentDto?: { content: string };
    },
  ) {
    // Convertimos los datos recibidos a un formato consistente
    const updateDto: UpdateCommentDto = {
      content: data.content || data.updateCommentDto?.content || '',
    };

    // Validamos que tengamos el contenido
    if (!updateDto.content) {
      throw new Error('Content no encontrado en los datos');
    }

    return this.publicationsService.editComment(
      data.id,
      data.userId,
      updateDto,
    );
  }

  @MessagePattern('deleteComment')
  async deleteComment(@Payload() data: DeleteCommentDto) {
    try {
      await this.publicationsService.deleteComment(data.id, data.userId);
      return {
        id: data.id,
        message: 'Comment deleted successfully.',
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @MessagePattern('getPublicationComments')
  getPublicationComments(@Payload() data: GetPublicationCommentsDto) {
    return this.publicationsService.getPublicationComments(data);
  }

  // Endpoints para reacciones
  @MessagePattern('createReaction')
  createReaction(@Payload() data: CreateReactionDto) {
    return this.publicationsService.createReaction(data, data.userId);
  }

  @MessagePattern('editReaction')
  editReaction(@Payload() data: EditReactionDto) {
    return this.publicationsService.editReaction(
      data.id,
      data.userId,
      data.updateReactionDto,
    );
  }

  @MessagePattern('deleteReaction')
  async deleteReaction(@Payload() data: DeleteReactionDto) {
    try {
      await this.publicationsService.deleteReaction(data.id, data.userId);
      return {
        id: data.id,
        message: 'Reaction deleted successfully.',
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @MessagePattern('getPublicationReactions')
  getPublicationReactions(@Payload() data: GetPublicationReactionsDto) {
    return this.publicationsService.getPublicationReactions(data);
  }
}
