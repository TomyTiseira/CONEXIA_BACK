import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { PostulationsController } from './postulations.controller';

@Module({
  imports: [NatsModule],
  controllers: [PostulationsController],
})
export class PostulationsModule {}
