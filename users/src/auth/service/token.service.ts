import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
    JwtPayload,
    LoginResponse,
    PasswordResetTokenPayload,
    RefreshTokenResponse,
} from '../interfaces/auth.interface';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateAccessToken(
    userId: number,
    email: string,
    roleId: number,
    profileId: number,
    isProfileComplete: boolean | null,
    lastActivityAt?: Date,
  ): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
      roleId,
      profileId,
      isProfileComplete,
      type: 'access',
      ...(lastActivityAt && { lastActivityAt: lastActivityAt.toISOString() }),
    };

    return this.jwtService.sign(payload, {
      expiresIn: '15m', // 15 minutos para access token
    });
  }

  generateRefreshToken(
    userId: number,
    email: string,
    roleId: number,
    profileId: number,
    isProfileComplete: boolean | null,
  ): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
      roleId,
      profileId,
      isProfileComplete,
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
    profileId: number,
    isProfileComplete: boolean | null,
    lastActivityAt?: Date,
  ): LoginResponse {
    const accessToken = this.generateAccessToken(
      userId,
      email,
      roleId,
      profileId,
      isProfileComplete,
      lastActivityAt,
    );
    const refreshToken = this.generateRefreshToken(
      userId,
      email,
      roleId,
      profileId,
      isProfileComplete,
    );

    return {
      user: {
        id: userId,
        email,
        roleId,
        profileId,
        isProfileComplete,
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
    profileId: number,
    isProfileComplete: boolean | null,
    lastActivityAt?: Date,
  ): RefreshTokenResponse {
    const accessToken = this.generateAccessToken(
      userId,
      email,
      roleId,
      profileId,
      isProfileComplete,
      lastActivityAt,
    );

    return {
      accessToken,
      expiresIn: 15 * 60, // 15 minutos en segundos
    };
  }

  generatePasswordResetToken(userId: number, email: string): string {
    const payload: Omit<PasswordResetTokenPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      expiresIn: '5m', // 5 minutos para password reset token
    });
  }
}
