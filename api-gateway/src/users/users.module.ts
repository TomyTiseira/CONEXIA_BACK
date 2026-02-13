import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { NatsModule } from 'src/transports/nats.module';
import { UsersController } from './users.controller';

@Module({
  imports: [NatsModule, AuthModule],
  controllers: [UsersController],
  providers: [],
})
export class UsersModule {}
