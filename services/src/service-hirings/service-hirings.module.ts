import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { ServicesModule } from '../services/services.module';
import { ServiceHiringsController } from './controllers/service-hirings.controller';
import { ServiceHiringStatus } from './entities/service-hiring-status.entity';
import { ServiceHiring } from './entities/service-hiring.entity';
import { ServiceHiringStatusRepository } from './repositories/service-hiring-status.repository';
import { ServiceHiringRepository } from './repositories/service-hiring.repository';
import { ServiceHiringOperationsService } from './services/service-hiring-operations.service';
import { ServiceHiringStatusService } from './services/service-hiring-status.service';
import { ServiceHiringTransformService } from './services/service-hiring-transform.service';
import { ServiceHiringValidationService } from './services/service-hiring-validation.service';
import { ServiceHiringsService } from './services/service-hirings.service';
import { AcceptServiceHiringUseCase } from './services/use-cases/accept-service-hiring.use-case';
import { CancelServiceHiringUseCase } from './services/use-cases/cancel-service-hiring.use-case';
import { CreateQuotationUseCase } from './services/use-cases/create-quotation.use-case';
import { CreateServiceHiringUseCase } from './services/use-cases/create-service-hiring.use-case';
import { EditQuotationUseCase } from './services/use-cases/edit-quotation.use-case';
import { GetServiceHiringsByServiceOwnerUseCase } from './services/use-cases/get-service-hirings-by-service-owner.use-case';
import { GetServiceHiringsByUserUseCase } from './services/use-cases/get-service-hirings-by-user.use-case';
import { GetServiceHiringsUseCase } from './services/use-cases/get-service-hirings.use-case';
import { NegotiateServiceHiringUseCase } from './services/use-cases/negotiate-service-hiring.use-case';
import { RejectServiceHiringUseCase } from './services/use-cases/reject-service-hiring.use-case';
import { ServiceHiringStateFactory } from './states/service-hiring-state.factory';

@Module({
  controllers: [ServiceHiringsController],
  providers: [
    ServiceHiringsService,
    CreateServiceHiringUseCase,
    CreateQuotationUseCase,
    EditQuotationUseCase,
    GetServiceHiringsUseCase,
    GetServiceHiringsByUserUseCase,
    GetServiceHiringsByServiceOwnerUseCase,
    AcceptServiceHiringUseCase,
    RejectServiceHiringUseCase,
    CancelServiceHiringUseCase,
    NegotiateServiceHiringUseCase,
    ServiceHiringRepository,
    ServiceHiringStatusRepository,
    ServiceHiringStatusService,
    ServiceHiringValidationService,
    ServiceHiringOperationsService,
    ServiceHiringTransformService,
    ServiceHiringStateFactory,
  ],
  imports: [
    TypeOrmModule.forFeature([ServiceHiring, ServiceHiringStatus]),
    CommonModule,
    forwardRef(() => ServicesModule),
  ],
  exports: [ServiceHiringsService, ServiceHiringRepository],
})
export class ServiceHiringsModule {}
