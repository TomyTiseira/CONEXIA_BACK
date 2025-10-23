import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs, NATS_SERVICE } from '../config';
import { ModerationController } from './controllers/moderation.controller';
import { ModerationAnalysis } from './entities/moderation-analysis.entity';
import { ModerationService } from './services/moderation.service';
import { OpenAIService } from './services/openai.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModerationAnalysis]),
    ScheduleModule.forRoot(),
    ClientsModule.register([
      {
        name: NATS_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers,
        },
      },
    ]),
  ],
  controllers: [ModerationController],
  providers: [ModerationService, OpenAIService],
  exports: [ModerationService],
})
export class ModerationModule {}
