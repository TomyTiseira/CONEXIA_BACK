import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { PublicationReportsController } from './publication-reports.controller';

@Module({
  imports: [NatsModule],
  controllers: [PublicationReportsController],
})
export class PublicationReportsModule {}
