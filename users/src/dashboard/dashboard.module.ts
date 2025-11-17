import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs, NATS_SERVICE } from 'src/config';
import { User } from 'src/shared/entities/user.entity';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { GetAdminDashboardMetricsUseCase } from './services/use-cases/get-admin-dashboard-metrics.use-case';
import { GetUserDashboardMetricsUseCase } from './services/use-cases/get-user-dashboard-metrics.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
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
  controllers: [DashboardController],
  providers: [
    DashboardService,
    GetUserDashboardMetricsUseCase,
    GetAdminDashboardMetricsUseCase,
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
