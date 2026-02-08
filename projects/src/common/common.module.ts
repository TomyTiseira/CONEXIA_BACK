import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs, USERS_SERVICE } from '../config';
import { EmailService } from './services/email.service';
import { MockEmailService } from './services/mock-email.service';
import { NodemailerService } from './services/nodemailer.service';
import { UsersClientService } from './services/users-client.service';

@Module({
  imports: [
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
  providers: [
    {
      provide: MockEmailService,
      useClass: NodemailerService,
    },
    {
      provide: EmailService,
      useClass: NodemailerService,
    },
    UsersClientService,
  ],
  exports: [ClientsModule, EmailService, UsersClientService],
})
export class CommonModule {}
