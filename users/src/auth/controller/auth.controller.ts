import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyCodeResetDto } from '../dto/verify-code-reset.dto';
import { AuthService } from '../service/auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('login')
  async login(@Payload() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);

    if ('onboardingToken' in result && result.onboardingToken) {
      return {
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          onboardingToken: result.onboardingToken,
          expiresIn: result.expiresIn,
          next: result.next,
        },
      };
    }

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      },
    };
  }

  @MessagePattern('refreshToken')
  async refreshToken(@Payload() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(refreshTokenDto);

    return {
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
    };
  }

  @MessagePattern('exchangeOnboardingToken')
  async exchangeOnboardingToken(
    @Payload() data: { onboardingToken: string },
  ) {
    const result = await this.authService.exchangeOnboardingToken(
      data.onboardingToken,
    );

    return {
      success: true,
      message: 'Session created successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      },
    };
  }

  @MessagePattern('forgotPassword')
  async forgotPassword(@Payload() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      message: 'Password reset email sent successfully.',
    };
  }

  @MessagePattern('verifyCodeReset')
  async verifyCodeReset(@Payload() verifyCodeResetDto: VerifyCodeResetDto) {
    const result = await this.authService.verifyCodeReset(verifyCodeResetDto);
    return {
      message: 'Code verified successfully.',
      data: {
        token: result.token,
      },
    };
  }

  @MessagePattern('resetPassword')
  async resetPassword(@Payload() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return {
      message: 'Password reset successfully.',
    };
  }
}
