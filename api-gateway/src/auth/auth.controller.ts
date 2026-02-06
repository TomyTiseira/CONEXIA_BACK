import { Body, Controller, Get, Inject, Post, Req, Res } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Response } from 'express';
import { catchError, firstValueFrom } from 'rxjs';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticatedRequest.interface';
import { jwtConfig } from 'src/config/jwt.config';
import { NATS_SERVICE } from '../config';
import { AutoRefreshAuth } from './decorators/auto-refresh-auth.decorator';
import { RefreshToken, ResetToken } from './decorators/token.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyCodeResetDto } from './dto/verify-code-reset.dto';
import {
  LoginResponse,
  RefreshTokenResponse,
  VerifyCodeResetResponse,
} from './interfaces/auth.interface';

@Controller('auth')
export class AuthController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    try {
      const result = (await firstValueFrom(
        this.client.send('login', loginDto).pipe(
          catchError((error) => {
            throw new RpcException(error);
          }),
        ),
      )) as LoginResponse;

      // Si el perfil está incompleto, el microservicio devuelve onboardingToken.
      // En ese caso NO se crea sesión real (access/refresh), solo cookie temporal de onboarding.
      if (result.data.onboardingToken) {
        res.clearCookie('access_token', {
          ...jwtConfig.cookieOptions,
          maxAge: 0,
        });
        res.clearCookie('refresh_token', {
          ...jwtConfig.cookieOptions,
          maxAge: 0,
        });

        res.cookie('onboarding_token', result.data.onboardingToken, {
          ...jwtConfig.cookieOptions,
          maxAge: result.data.expiresIn * 1000,
        });

        res.json({
          success: true,
          message: result.message,
          data: {
            user: result.data.user,
            expiresIn: result.data.expiresIn,
            next: 'PROFILE_REQUIRED',
          },
        });
        return;
      }

      // Login normal (perfil completo) => sesión real.
      if (!result.data.accessToken || !result.data.refreshToken) {
        throw new RpcException({
          statusCode: 500,
          message: 'Invalid login response from auth service',
        });
      }

      // Limpiar onboarding si existía de antes
      res.clearCookie('onboarding_token', {
        ...jwtConfig.cookieOptions,
        maxAge: 0,
      });

      res.cookie('access_token', result.data.accessToken, {
        ...jwtConfig.cookieOptions,
        maxAge: result.data.expiresIn * 1000,
      });

      res.cookie('refresh_token', result.data.refreshToken, {
        ...jwtConfig.cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        message: result.message,
        data: {
          user: result.data.user,
          expiresIn: result.data.expiresIn,
        },
      });
    } catch (error: any) {
      // Manejar errores del microservicio preservando el código de estado
      let statusCode = 400;
      let errorMessage = 'Internal server error';

      if (error instanceof RpcException) {
        const rpcError = error.getError() as Record<string, any>;

        // Extraer información del error RPC
        if (typeof rpcError === 'object' && rpcError !== null) {
          statusCode =
            (rpcError.statusCode as number) ||
            (rpcError.status as number) ||
            400;
          errorMessage = (rpcError.message as string) || errorMessage;
        } else if (typeof rpcError === 'string') {
          errorMessage = rpcError;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      res.status(statusCode).json({
        success: false,
        message: errorMessage,
      });
    }
  }

  @Post('refresh')
  async refreshToken(
    @RefreshToken() refreshToken: string,
    @Res() res: Response,
  ) {
    try {
      const result = (await firstValueFrom(
        this.client.send('refreshToken', { refreshToken }).pipe(
          catchError((error) => {
            throw new RpcException(error);
          }),
        ),
      )) as RefreshTokenResponse;

      // Configurar nueva cookie de access token
      res.cookie('access_token', result.data.accessToken, {
        ...jwtConfig.cookieOptions,
        maxAge: result.data.expiresIn * 1000,
      });

      res.json({
        success: true,
        message: result.message,
        data: {
          expiresIn: result.data.expiresIn,
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.client.send('forgotPassword', forgotPasswordDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post('verify-code-reset')
  async verifyCodeReset(
    @Body() verifyCodeResetDto: VerifyCodeResetDto,
    @Res() res: Response,
  ) {
    try {
      const result = (await firstValueFrom(
        this.client.send('verifyCodeReset', verifyCodeResetDto).pipe(
          catchError((error) => {
            throw new RpcException(error);
          }),
        ),
      )) as VerifyCodeResetResponse;

      // Configurar cookie con el token de reset
      res.cookie('password_reset_token', result.data.token, {
        ...jwtConfig.cookieOptions,
        maxAge: 5 * 60 * 1000, // 5 minutos
      });

      res.json({
        success: true,
        message: 'Code verified successfully. You can now reset your password.',
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in verify-code-reset:', errorMessage);
      res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }
  }

  @Post('reset-password')
  resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @ResetToken() resetToken: string,
  ) {
    // Agregar el token al DTO
    const resetData = {
      ...resetPasswordDto,
      resetToken,
    };

    return this.client.send('resetPassword', resetData).pipe(
      catchError((error: unknown) => {
        throw new RpcException(error as string | object);
      }),
    );
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('access_token', {
      ...jwtConfig.cookieOptions,
      maxAge: 0,
    });
    res.clearCookie('refresh_token', {
      ...jwtConfig.cookieOptions,
      maxAge: 0,
    });
    res.clearCookie('onboarding_token', {
      ...jwtConfig.cookieOptions,
      maxAge: 0,
    });
    res.json({ success: true, message: 'Logged out successfully' });
  }

  @Get('me')
  @AutoRefreshAuth()
  getProfile(@Req() req: AuthenticatedRequest) {
    return {
      user: req.user,
    };
  }
}
