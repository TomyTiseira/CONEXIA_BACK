import { Module } from '@nestjs/common';
import { MockEmailService } from '../common/services/mock-email.service';
import { EmailService } from '../common/services/email.service';
import { NodemailerService } from '../common/services/nodemailer.service';
import { SharedModule } from '../shared/shared.module';
import { NatsModule } from '../transports/nats.module';
import { UsersModule } from '../users/users.module';
import { AuthSharedModule } from './auth-shared.module';
import { AuthController } from './controller/auth.controller';
import { AuthRepository } from './repository/auth.repository';
import { AuthService } from './service/auth.service';
import { ExchangeOnboardingTokenUseCase } from './service/use-cases/exchange-onboarding-token.use-cases';
import { ForgotPasswordUseCase } from './service/use-cases/forgot-password.use-cases';
import { LoginUseCase } from './service/use-cases/login.use-cases';
import { RefreshTokenUseCase } from './service/use-cases/refresh-token.use-cases';
import { ResetPasswordUseCase } from './service/use-cases/reset-password.use-cases';
import { VerifyCodeResetUseCase } from './service/use-cases/verify-code-reset.use-cases';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    LoginUseCase,
    RefreshTokenUseCase,
    ExchangeOnboardingTokenUseCase,
    AuthRepository,
    ForgotPasswordUseCase,
    VerifyCodeResetUseCase,
    ResetPasswordUseCase,
    {
      provide: MockEmailService,
      useClass: NodemailerService,
    },
    {
      provide: EmailService,
      useClass: NodemailerService,
    },
  ],
  imports: [NatsModule, SharedModule, UsersModule, AuthSharedModule],
  exports: [AuthService],
})
export class AuthModule {}
