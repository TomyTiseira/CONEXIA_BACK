import { Module } from '@nestjs/common';
import { NatsModule } from 'src/transports/nats.module';
import { UsersController } from './users.controller';

@Module({
  imports: [NatsModule],
  controllers: [UsersController],
  providers: [],
})
export class UsersModule {}
