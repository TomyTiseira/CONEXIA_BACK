import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { envs } from '../config';
import { NatsModule } from '../transports/nats.module';
import { AuthController } from './auth.controller';
import { AutoRefreshJwtGuard } from './guards/auto-refresh-jwt.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RoleGuard } from './guards/role.guard';
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
  providers: [JwtStrategy, JwtAuthGuard, AutoRefreshJwtGuard, RoleGuard],
  exports: [JwtAuthGuard, AutoRefreshJwtGuard, RoleGuard],
})
export class AuthModule {}
