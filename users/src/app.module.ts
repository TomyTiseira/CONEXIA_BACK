import { Module } from '@nestjs/common';
import { NatsModule } from './transports/nats.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule, NatsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
