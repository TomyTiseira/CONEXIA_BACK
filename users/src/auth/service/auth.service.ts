import { Injectable } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyCodeResetDto } from '../dto/verify-code-reset.dto';
import {
  LoginResponse,
  RefreshTokenResponse,
} from '../interfaces/auth.interface';
import { ForgotPasswordUseCase } from './use-cases/forgot-password.use-cases';
import { LoginUseCase } from './use-cases/login.use-cases';
import { ExchangeOnboardingTokenUseCase } from './use-cases/exchange-onboarding-token.use-cases';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-cases';
import { ResetPasswordUseCase } from './use-cases/reset-password.use-cases';
import { VerifyCodeResetUseCase } from './use-cases/verify-code-reset.use-cases';

@Injectable()
export class AuthService {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly exchangeOnboardingTokenUseCase: ExchangeOnboardingTokenUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly verifyCodeResetUseCase: VerifyCodeResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  async login(loginData: LoginDto): Promise<LoginResponse> {
    return this.loginUseCase.execute(loginData);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponse> {
    return this.refreshTokenUseCase.execute(refreshTokenDto);
  }

  async exchangeOnboardingToken(onboardingToken: string): Promise<LoginResponse> {
    return this.exchangeOnboardingTokenUseCase.execute(onboardingToken);
  }

  async forgotPassword(email: string): Promise<void> {
    return this.forgotPasswordUseCase.execute(email);
  }

  async verifyCodeReset(
    verifyCodeResetDto: VerifyCodeResetDto,
  ): Promise<{ token: string }> {
    return this.verifyCodeResetUseCase.execute(verifyCodeResetDto);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    await this.resetPasswordUseCase.execute(resetPasswordDto);
    return {
      message: 'Password reset successfully.',
    };
  }
}
