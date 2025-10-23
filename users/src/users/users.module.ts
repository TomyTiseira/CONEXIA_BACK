import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from 'src/common/services/email.service';
import { NatsModule } from 'src/transports/nats.module';
import { AuthSharedModule } from '../auth/auth-shared.module';
import { MockEmailService } from '../common/services/mock-email.service';
import { NodemailerService } from '../common/services/nodemailer.service';
import { ProfileModule } from '../profile/profile.module';
import { DocumentType } from '../shared/entities/document-type.entity';
import { Role } from '../shared/entities/role.entity';
import { SharedModule } from '../shared/shared.module';
import { VerificationModule } from '../verification/verification.module';
import { DocumentTypesController } from './controller/document-types.controller';
import { UsersController } from './controller/users.controller';
import { DocumentTypesService } from './service/document-types.service';
import { CreateUserUseCase } from './service/use-cases/create-user.use-cases';
import { DeleteUserUseCase } from './service/use-cases/delate-user.use-cases';
import {
  FindUserByIdIncludingDeletedUseCase,
  FindUserByIdUseCase,
  FindUserByIdWithRelationsUseCase,
} from './service/use-cases/find-user-by-id.use-cases';
import { FindUsersByIdsUseCase } from './service/use-cases/find-users-by-ids.use-cases';
import { GetRoleByIdUseCase } from './service/use-cases/get-role-by-id.use-cases';
import { GetRoleByNameUseCase } from './service/use-cases/get-role-by-name.use-cases';
import { GetUserWithProfileUseCase } from './service/use-cases/get-user-with-profile.use-cases';
import { PingUseCase } from './service/use-cases/ping';
import { ResendVerificationUseCase } from './service/use-cases/resend-verification.use-cases';
import { SearchUsersPaginatedUseCase } from './service/use-cases/search-users-paginated.use-cases';
import { UpdateUserUseCase } from './service/use-cases/update-user.use-cases';
import { VerifyUserUseCase } from './service/use-cases/verify-user.use-cases';
import { UsersService } from './service/users.service';

@Module({
  imports: [
    NatsModule,
    SharedModule,
    ProfileModule,
    AuthSharedModule,
    VerificationModule,
    TypeOrmModule.forFeature([DocumentType, Role]),
  ],
  controllers: [UsersController, DocumentTypesController],
  providers: [
    UsersService,
    DocumentTypesService,
    PingUseCase,
    CreateUserUseCase,
    VerifyUserUseCase,
    UpdateUserUseCase,
    ResendVerificationUseCase,
    DeleteUserUseCase,
    GetRoleByIdUseCase,
    GetRoleByNameUseCase,
    FindUserByIdUseCase,
    FindUserByIdIncludingDeletedUseCase,
    FindUserByIdWithRelationsUseCase,
    GetUserWithProfileUseCase,
    FindUsersByIdsUseCase,
    SearchUsersPaginatedUseCase,
    {
      provide: MockEmailService,
      useClass: NodemailerService,
    },
    {
      provide: EmailService,
      useClass: NodemailerService,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
