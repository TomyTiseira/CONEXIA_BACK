import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';

@Module({
  imports: [NatsModule],
  exports: [NatsModule],
})
export class CommonModule {}
