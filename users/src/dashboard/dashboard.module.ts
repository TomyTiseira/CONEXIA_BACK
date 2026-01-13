import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs, NATS_SERVICE } from 'src/config';
import { User } from 'src/shared/entities/user.entity';
import { UserReviewReport } from 'src/user-review-report/entities/user-review-report.entity';
import { UserVerification } from 'src/verification/entities/user-verification.entity';
import { DashboardReportsController } from './controllers/dashboard-reports.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardReportsService } from './services/dashboard-reports.service';
import { DashboardService } from './services/dashboard.service';
import { GetAdminDashboardMetricsUseCase } from './services/use-cases/get-admin-dashboard-metrics.use-case';
import { GetModeratorDashboardMetricsUseCase } from './services/use-cases/get-moderator-dashboard-metrics.use-case';
import { GetUserDashboardMetricsUseCase } from './services/use-cases/get-user-dashboard-metrics.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserVerification, UserReviewReport]),
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
  controllers: [DashboardController, DashboardReportsController],
  providers: [
    DashboardService,
    DashboardReportsService,
    GetUserDashboardMetricsUseCase,
    GetAdminDashboardMetricsUseCase,
    GetModeratorDashboardMetricsUseCase,
  ],
  exports: [DashboardService, DashboardReportsService],
})
export class DashboardModule {}
