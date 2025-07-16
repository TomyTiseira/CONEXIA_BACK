import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { InternalUsersController } from './internal-users.controller';
import { InternalUsersService } from './internal-users.service';

@Module({
  imports: [NatsModule],
  controllers: [InternalUsersController],
  providers: [InternalUsersService],
})
export class InternalUsersModule {}
