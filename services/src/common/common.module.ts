import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs, USERS_SERVICE } from '../config';
import { EmailService } from './services/email.service';
import { NodemailerService } from './services/nodemailer.service';
import { PaymentAccountsClientService } from './services/payment-accounts-client.service';
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
    UsersClientService,
    PaymentAccountsClientService,
    {
      provide: EmailService,
      useClass: NodemailerService,
    },
  ],
  exports: [UsersClientService, PaymentAccountsClientService, EmailService],
})
export class CommonModule {}
