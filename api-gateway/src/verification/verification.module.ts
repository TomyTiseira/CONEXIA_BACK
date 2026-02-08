import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { VerificationController } from './verification.controller';

@Module({
  imports: [NatsModule],
  controllers: [VerificationController],
})
export class VerificationModule {}
