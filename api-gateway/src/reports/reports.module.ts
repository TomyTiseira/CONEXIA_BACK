import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { ReportsController } from './reports.controller';

@Module({
  imports: [NatsModule],
  controllers: [ReportsController],
  providers: [],
  exports: [],
})
export class ReportsModule {}
