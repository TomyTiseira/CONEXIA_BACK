import { Module } from '@nestjs/common';
import { MembreshipsModule } from './membreships/membreships.module';
import { NatsModule } from './transports/nats.module';

@Module({
  imports: [MembreshipsModule, NatsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
