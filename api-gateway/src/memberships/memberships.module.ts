import { Module } from '@nestjs/common';
import { NatsModule } from 'src/transports/nats.module';
import { MembershipsController } from './memberships.controller';

@Module({
  imports: [NatsModule],
  controllers: [MembershipsController],
})
export class MembershipsModule {}
