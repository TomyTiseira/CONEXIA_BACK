import { Module } from '@nestjs/common';
import { NatsModule } from 'src/transports/nats.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [NatsModule],
})
export class UsersModule {}
