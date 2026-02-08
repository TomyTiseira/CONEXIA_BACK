import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs, USERS_SERVICE } from 'src/config';
import { EmailService } from '../common/services/email.service';
import { MockEmailService } from '../common/services/mock-email.service';
import { NodemailerService } from '../common/services/nodemailer.service';
import { UserSearchService } from '../common/services/user-search.service';
import { UsersService } from '../common/services/users.service';
import { ContactsController } from './controllers/contacts.controller';
import { MessagingController } from './controllers/messaging.controller';
import { Connection } from './entities/connection.entity';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { ConnectionRepository } from './repositories/connection.repository';
import { ConversationRepository } from './repositories/conversation.repository';
import { MessageRepository } from './repositories/message.repository';
import { ContactsService } from './services/contacts.service';
import {
  AcceptConnectionUseCase,
  DeleteConnectionRequestUseCase,
  DeleteUserConnectionsOnBanUseCase,
  GetConnectionInfoUseCase,
  GetConnectionRequestsUseCase,
  GetConnectionStatusUseCase,
  GetConversationsUseCase,
  GetFriendsUseCase,
  GetMessagesUseCase,
  GetSentConnectionRequestsUseCase,
  GetUnreadCountUseCase,
  MarkMessagesReadUseCase,
  SendConnectionRequestUseCase,
  SendMessageUseCase,
} from './services/use-cases';
import { GetRecommendationsUseCase } from './services/use-cases/get-recommendations.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([Connection, Conversation, Message]),
    ClientsModule.register([
      {
        name: USERS_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers,
        },
      },
    ]),
  ],
  controllers: [ContactsController, MessagingController],
  providers: [
    ContactsService,
    ConnectionRepository,
    ConversationRepository,
    MessageRepository,
    SendConnectionRequestUseCase,
    GetConnectionRequestsUseCase,
    GetSentConnectionRequestsUseCase,
    GetConnectionStatusUseCase,
    GetConnectionInfoUseCase,
    AcceptConnectionUseCase,
    DeleteConnectionRequestUseCase,
    DeleteUserConnectionsOnBanUseCase,
    GetFriendsUseCase,
    SendMessageUseCase,
    GetConversationsUseCase,
    GetMessagesUseCase,
    GetUnreadCountUseCase,
    MarkMessagesReadUseCase,
    UsersService,
    UserSearchService,
    GetRecommendationsUseCase,
    {
      provide: MockEmailService,
      useClass: NodemailerService,
    },
    {
      provide: EmailService,
      useClass: NodemailerService,
    },
  ],
  exports: [
    ContactsService,
    ConnectionRepository,
    ConversationRepository,
    MessageRepository,
  ],
})
export class ContactsModule {}
