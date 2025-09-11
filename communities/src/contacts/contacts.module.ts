import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs, USERS_SERVICE } from 'src/config';
import { EmailService } from '../common/services/email.service';
import { MockEmailService } from '../common/services/mock-email.service';
import { NodemailerService } from '../common/services/nodemailer.service';
import { UsersService } from '../common/services/users.service';
import { ContactsController } from './controllers/contacts.controller';
import { Connection } from './entities/connection.entity';
import { ConnectionRepository } from './repositories/connection.repository';
import { ContactsService } from './services/contacts.service';
import {
  AcceptConnectionUseCase,
  DeleteConnectionRequestUseCase,
  GetConnectionInfoUseCase,
  GetConnectionRequestsUseCase,
  GetConnectionStatusUseCase,
  GetFriendsUseCase,
  GetSentConnectionRequestsUseCase,
  SendConnectionRequestUseCase,
} from './services/use-cases';

@Module({
  imports: [
    TypeOrmModule.forFeature([Connection]),
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
  controllers: [ContactsController],
  providers: [
    ContactsService,
    ConnectionRepository,
    SendConnectionRequestUseCase,
    GetConnectionRequestsUseCase,
    GetSentConnectionRequestsUseCase,
    GetConnectionStatusUseCase,
    GetConnectionInfoUseCase,
    AcceptConnectionUseCase,
    DeleteConnectionRequestUseCase,
    GetFriendsUseCase,
    UsersService,
    {
      provide: MockEmailService,
      useClass: NodemailerService,
    },
    {
      provide: EmailService,
      useClass: NodemailerService,
    },
  ],
  exports: [ContactsService, ConnectionRepository],
})
export class ContactsModule {}
