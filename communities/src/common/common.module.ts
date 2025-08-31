import { Module } from '@nestjs/common';
import { NatsModule } from './nats/nats.module';
import { UsersService } from './services/users.service';

@Module({
  imports: [NatsModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class CommonModule {}
