import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  JwtPayload,
  LoginResponse,
  RefreshTokenResponse,
} from '../interfaces/auth.interface';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateAccessToken(userId: number, email: string, roleId: number): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
      roleId,
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      expiresIn: '15m', // 15 minutos para access token
    });
  }

  generateRefreshToken(userId: number, email: string, roleId: number): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
      roleId,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      expiresIn: '7d', // 7 días para refresh token
    });
  }

  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify(token);
  }

  createLoginResponse(
    userId: number,
    email: string,
    roleId: number,
  ): LoginResponse {
    const accessToken = this.generateAccessToken(userId, email, roleId);
    const refreshToken = this.generateRefreshToken(userId, email, roleId);

    return {
      user: {
        id: userId,
        email,
        roleId,
      },
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutos en segundos
    };
  }

  createRefreshResponse(
    userId: number,
    email: string,
    roleId: number,
  ): RefreshTokenResponse {
    const accessToken = this.generateAccessToken(userId, email, roleId);

    return {
      accessToken,
      expiresIn: 15 * 60, // 15 minutos en segundos
    };
  }
}
