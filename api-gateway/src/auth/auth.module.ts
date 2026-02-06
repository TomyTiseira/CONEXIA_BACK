import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { envs } from '../config';
import { NatsModule } from '../transports/nats.module';
import { AuthController } from './auth.controller';
import { AutoRefreshJwtGuard } from './guards/auto-refresh-jwt.guard';
import { OnboardingJwtGuard } from './guards/onboarding-jwt.guard';
import { OnboardingOrSessionGuard } from './guards/onboarding-or-session.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RoleGuard } from './guards/role.guard';
import { OnboardingJwtStrategy } from './strategies/onboarding-jwt.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    NatsModule,
    JwtModule.register({
      secret: envs.jwtSecret,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    OnboardingJwtStrategy,
    JwtAuthGuard,
    AutoRefreshJwtGuard,
    OnboardingJwtGuard,
    OnboardingOrSessionGuard,
    RoleGuard,
  ],
  exports: [
    JwtAuthGuard,
    AutoRefreshJwtGuard,
    OnboardingJwtGuard,
    OnboardingOrSessionGuard,
    RoleGuard,
  ],
})
export class AuthModule {}
