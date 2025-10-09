import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common/common.module';
import { RpcExceptionInterceptor } from './common/interceptors/rpc-exception.interceptor';
import { envs } from './config';
import { SeedService } from './seed/seed.service';
import {
  Payment,
  ServiceHiring,
  ServiceHiringStatus,
} from './service-hirings/entities';
import { ServiceHiringStatusRepository } from './service-hirings/repositories/service-hiring-status.repository';
import { ServiceHiringsModule } from './service-hirings/service-hirings.module';
import { ServiceReport } from './service-reports/entities/service-report.entity';
import { ServiceReportsModule } from './service-reports/service-reports.module';
import { Service, ServiceCategory } from './services/entities';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: envs.dbHost,
      port: parseInt(envs.dbPort),
      username: envs.dbUsername,
      password: envs.dbPassword,
      database: envs.dbDatabase,
      entities: [
        Service,
        ServiceCategory,
        ServiceHiring,
        ServiceHiringStatus,
        Payment,
        ServiceReport,
      ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([ServiceHiringStatus]),
    CommonModule,
    ServicesModule,
    ServiceHiringsModule,
    ServiceReportsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RpcExceptionInterceptor,
    },
    ServiceHiringStatusRepository,
    SeedService,
  ],
})
export class AppModule {}
