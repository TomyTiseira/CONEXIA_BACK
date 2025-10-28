import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common/common.module';
import { RpcExceptionInterceptor } from './common/interceptors/rpc-exception.interceptor';
import { envs } from './config';
import { SeedService } from './seed/seed.service';
import {
    Claim,
    Deliverable,
    DeliverySubmission,
    Payment,
    PaymentModality,
    ServiceHiring,
    ServiceHiringStatus,
} from './service-hirings/entities';
import { PaymentModalityRepository } from './service-hirings/repositories/payment-modality.repository';
import { ServiceHiringStatusRepository } from './service-hirings/repositories/service-hiring-status.repository';
import { ServiceHiringsModule } from './service-hirings/service-hirings.module';
import { ServiceReport } from './service-reports/entities/service-report.entity';
import { ServiceReportsModule } from './service-reports/service-reports.module';
import { ServiceReviewReport } from './service-review-reports/entities/service-review-report.entity';
import { ServiceReviewReportsModule } from './service-review-reports/service-review-reports.module';
import { ServiceReview } from './service-reviews/entities/service-review.entity';
import { ServiceReviewsModule } from './service-reviews/service-reviews.module';
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
        ServiceReview,
        ServiceReviewReport,
        PaymentModality,
        Deliverable,
        DeliverySubmission,
        Claim,
      ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([ServiceHiringStatus, PaymentModality]),
    CommonModule,
    ServicesModule,
    ServiceHiringsModule,
    ServiceReportsModule,
    ServiceReviewsModule,
    ServiceReviewReportsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RpcExceptionInterceptor,
    },
    ServiceHiringStatusRepository,
    PaymentModalityRepository,
    SeedService,
  ],
})
export class AppModule {}
