import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [NatsModule],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
