import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  imports: [NatsModule],
  controllers: [UsersController],
  providers: [],
})
export class UsersModule {}
