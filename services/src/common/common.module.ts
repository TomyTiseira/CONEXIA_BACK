import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs, USERS_SERVICE } from '../config';
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
  providers: [UsersClientService],
  exports: [UsersClientService],
})
export class CommonModule {}
