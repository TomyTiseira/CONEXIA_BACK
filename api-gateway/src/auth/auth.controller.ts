import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Response } from 'express';
import { catchError, firstValueFrom } from 'rxjs';
import { jwtConfig } from 'src/config/jwt.config';
import { NATS_SERVICE } from '../config';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  RefreshTokenInterceptor,
  RequestWithRefreshToken,
} from './interceptors/refresh-token.interceptor';
import {
  AuthenticatedRequest,
  LoginResponse,
  RefreshTokenResponse,
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

      // Configurar cookies
      res.cookie('access_token', result.data.accessToken, {
        ...jwtConfig.cookieOptions,
        maxAge: result.data.expiresIn * 1000,
      });

      res.cookie('refresh_token', result.data.refreshToken, {
        ...jwtConfig.cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      });

      // Enviar respuesta sin tokens en el body
      res.json({
        success: true,
        message: result.message,
        data: {
          user: result.data.user,
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

  @Post('refresh')
  @UseInterceptors(RefreshTokenInterceptor)
  async refreshToken(
    @Req() req: RequestWithRefreshToken,
    @Res() res: Response,
  ) {
    try {
      const result = (await firstValueFrom(
        this.client
          .send('refreshToken', { refreshToken: req.refreshToken })
          .pipe(
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
    res.json({ success: true, message: 'Logged out successfully' });
  }

  // Para probar la autenticación
  // TODO: Eliminar este endpoint
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: AuthenticatedRequest) {
    return {
      success: true,
      data: {
        user: req.user,
      },
    };
  }
}
