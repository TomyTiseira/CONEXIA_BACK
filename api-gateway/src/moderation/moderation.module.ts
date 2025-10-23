import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { ModerationController } from './moderation.controller';

@Module({
  imports: [NatsModule],
  controllers: [ModerationController],
})
export class ModerationModule {}
