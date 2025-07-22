import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { InternalUsersController } from './internal-users.controller';

@Module({
  imports: [NatsModule],
  controllers: [InternalUsersController],
  providers: [],
})
export class InternalUsersModule {}
