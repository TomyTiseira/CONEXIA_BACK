import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from 'src/common/services/email.service';
import { NatsModule } from 'src/transports/nats.module';
import { TokenService } from '../auth/service/token.service';
import { MockEmailService } from '../common/services/mock-email.service';
import { NodemailerService } from '../common/services/nodemailer.service';
import { UserBaseService } from '../common/services/user-base.service';
import { jwtConfig } from '../config/jwt.config';
import { ProfileModule } from '../profile/profile.module';
import { SharedModule } from '../shared/shared.module';
import { DocumentTypesController } from './controller/document-types.controller';
import { UsersController } from './controller/users.controller';
import { UserRepository } from './repository/users.repository';
import { DocumentTypesService } from './service/document-types.service';
import { CreateUserUseCase } from './service/use-cases/create-user.use-cases';
import { GetRoleByIdUseCase } from './service/use-cases/get-role-by-id.use-cases';
import { PingUseCase } from './service/use-cases/ping';
import { ResendVerificationUseCase } from './service/use-cases/resend-verification.use-cases';
import { UpdateUserUseCase } from './service/use-cases/update-user.use-cases';
import { VerifyUserUseCase } from './service/use-cases/verify-user.use-cases';
import { UsersService } from './service/users.service';

@Module({
  controllers: [UsersController, DocumentTypesController],
  providers: [
    UsersService,
    DocumentTypesService,
    PingUseCase,
    CreateUserUseCase,
    VerifyUserUseCase,
    UpdateUserUseCase,
    ResendVerificationUseCase,
    GetRoleByIdUseCase,
    UserBaseService,
    UserRepository,
    TokenService,
    {
      provide: MockEmailService,
      useClass: NodemailerService,
    },
    {
      provide: EmailService,
      useClass: NodemailerService,
    },
  ],
  imports: [
    NatsModule,
    SharedModule,
    ProfileModule,
    JwtModule.register(jwtConfig),
  ],
  exports: [UserRepository, UserBaseService],
})
export class UsersModule {}
