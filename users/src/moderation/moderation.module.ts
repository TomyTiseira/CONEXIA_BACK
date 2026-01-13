import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from 'src/common/services/email.service';
import { NodemailerService } from 'src/common/services/nodemailer.service';
import { User } from 'src/shared/entities/user.entity';
import { envs, NATS_SERVICE } from '../config';
import { ModerationController } from './controllers/moderation.controller';
import { ModerationAction } from './entities/moderation-action.entity';
import { ModerationAnalysis } from './entities/moderation-analysis.entity';
import { BanManagementService } from './services/ban-management.service';
import { ModerationService } from './services/moderation.service';
import { OpenAIService } from './services/openai.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModerationAnalysis, ModerationAction, User]),
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
  providers: [
    ModerationService,
    OpenAIService,
    BanManagementService,
    {
      provide: EmailService,
      useClass: NodemailerService,
    },
  ],
  exports: [ModerationService, BanManagementService],
})
export class ModerationModule {}
