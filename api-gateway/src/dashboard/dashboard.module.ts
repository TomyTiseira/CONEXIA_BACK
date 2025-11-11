import { Module } from '@nestjs/common';
import { NatsModule } from 'src/transports/nats.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [NatsModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
