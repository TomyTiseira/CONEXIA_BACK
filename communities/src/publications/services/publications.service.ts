import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { CreatePublicationDto } from '../dto/create-publication.dto';
import { CreateReactionDto } from '../dto/create-reaction.dto';
import { GetPublicationCommentsDto } from '../dto/get-publication-comments.dto';
import { GetPublicationReactionsDto } from '../dto/get-publication-reactions.dto';
import { GetPublicationsDto } from '../dto/get-publications.dto';
import { GetUserPublicationsDto } from '../dto/get-user-publications.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { UpdatePublicationDto } from '../dto/update-publication.dto';
import { UpdateReactionDto } from '../dto/update-reaction.dto';
import {
  CreateCommentUseCase,
  CreatePublicationUseCase,
  CreateReactionUseCase,
  DeleteCommentUseCase,
  DeletePublicationUseCase,
  DeleteReactionUseCase,
  EditCommentUseCase,
  EditPublicationUseCase,
  EditReactionUseCase,
  GetPublicationByIdUseCase,
  GetPublicationCommentsUseCase,
  GetPublicationDetailUseCase,
  GetPublicationReactionsUseCase,
  GetPublicationsUseCase,
  GetUserPublicationsUseCase,
} from './use-cases';

@Injectable()
export class PublicationsService {
  constructor(
    // Publicaciones
    private readonly createPublicationUseCase: CreatePublicationUseCase,
    private readonly editPublicationUseCase: EditPublicationUseCase,
    private readonly deletePublicationUseCase: DeletePublicationUseCase,
    private readonly getPublicationsUseCase: GetPublicationsUseCase,
    private readonly getPublicationByIdUseCase: GetPublicationByIdUseCase,
    private readonly getPublicationDetailUseCase: GetPublicationDetailUseCase,
    private readonly getUserPublicationsUseCase: GetUserPublicationsUseCase,

    // Comentarios
    private readonly createCommentUseCase: CreateCommentUseCase,
    private readonly editCommentUseCase: EditCommentUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
    private readonly getPublicationCommentsUseCase: GetPublicationCommentsUseCase,

    // Reacciones
    private readonly createReactionUseCase: CreateReactionUseCase,
    private readonly editReactionUseCase: EditReactionUseCase,
    private readonly deleteReactionUseCase: DeleteReactionUseCase,
    private readonly getPublicationReactionsUseCase: GetPublicationReactionsUseCase,
  ) {}

  ping() {
    return {
      message: 'Publications microservice is running!',
      timestamp: new Date().toISOString(),
    };
  }

  async createPublication(data: CreatePublicationDto, userId: number) {
    return await this.createPublicationUseCase.execute(data, userId);
  }

  async editPublication(
    id: number,
    userId: number,
    updateDto: Partial<UpdatePublicationDto>,
  ) {
    return await this.editPublicationUseCase.execute(id, userId, updateDto);
  }

  async deletePublication(id: number, userId: number) {
    return await this.deletePublicationUseCase.execute(id, userId);
  }

  async getPublications(data: GetPublicationsDto) {
    return await this.getPublicationsUseCase.execute(data);
  }

  async getUserPublications(data: GetUserPublicationsDto) {
    return await this.getUserPublicationsUseCase.execute(data);
  }

  async getPublicationById(id: number, currentUserId?: number) {
    return await this.getPublicationByIdUseCase.execute(id, currentUserId);
  }

  async getPublicationDetail(id: number, currentUserId?: number) {
    return await this.getPublicationDetailUseCase.execute(id, currentUserId);
  }

  // Métodos para comentarios
  async createComment(data: CreateCommentDto, userId: number) {
    return await this.createCommentUseCase.execute(data, userId);
  }

  async editComment(id: number, userId: number, updateDto: UpdateCommentDto) {
    return await this.editCommentUseCase.execute(id, userId, updateDto);
  }

  async deleteComment(id: number, userId: number) {
    return await this.deleteCommentUseCase.execute(id, userId);
  }

  async getPublicationComments(data: GetPublicationCommentsDto) {
    return await this.getPublicationCommentsUseCase.execute(data);
  }

  // Métodos para reacciones
  async createReaction(data: CreateReactionDto, userId: number) {
    return await this.createReactionUseCase.execute(data, userId);
  }

  async editReaction(id: number, userId: number, updateDto: UpdateReactionDto) {
    return await this.editReactionUseCase.execute(id, userId, updateDto);
  }

  async deleteReaction(id: number, userId: number) {
    return await this.deleteReactionUseCase.execute(id, userId);
  }

  async getPublicationReactions(data: GetPublicationReactionsDto) {
    return await this.getPublicationReactionsUseCase.execute(data);
  }
}
