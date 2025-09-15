import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { NatsModule } from '../common/nats/nats.module';
import { ContactsModule } from '../contacts/contacts.module';
import { PublicationsController } from './controllers/publications.controller';
import { PublicationComment } from './entities/publication-comment.entity';
import { PublicationReaction } from './entities/publication-reaction.entity';
import { Publication } from './entities/publication.entity';
import { CommentRepository } from './repositories/comment.repository';
import { PublicationRepository } from './repositories/publication.repository';
import { ReactionRepository } from './repositories/reaction.repository';
import { ConnectionStatusService } from './services/helpers/connection-status.service';
import { ContactHelperService } from './services/helpers/contact-helper.service';
import { OwnerHelperService } from './services/helpers/owner-helper.service';
import { PublicationsService } from './services/publications.service';
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
} from './services/use-cases';
import { UserInfoService } from './services/user-info.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Publication,
      PublicationComment,
      PublicationReaction,
    ]),
    CommonModule,
    ContactsModule,
    // Importar el módulo NatsModule para usar USERS_SERVICE
    NatsModule,
  ],
  controllers: [PublicationsController],
  providers: [
    PublicationsService,
    // Repositorios
    PublicationRepository,
    CommentRepository,
    ReactionRepository,
    // Helpers
    OwnerHelperService,
    ContactHelperService,
    // Servicios de información
    UserInfoService,
    // Casos de uso de publicaciones
    ConnectionStatusService,
    CreatePublicationUseCase,
    EditPublicationUseCase,
    DeletePublicationUseCase,
    GetPublicationsUseCase,
    GetPublicationByIdUseCase,
    GetPublicationDetailUseCase,
    GetUserPublicationsUseCase,
    // Casos de uso de comentarios
    CreateCommentUseCase,
    EditCommentUseCase,
    DeleteCommentUseCase,
    GetPublicationCommentsUseCase,
    // Casos de uso de reacciones
    CreateReactionUseCase,
    EditReactionUseCase,
    DeleteReactionUseCase,
    GetPublicationReactionsUseCase,
  ],
  exports: [PublicationRepository],
})
export class PublicationsModule {}
