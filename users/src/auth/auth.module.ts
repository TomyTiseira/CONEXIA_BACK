import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../config/jwt.config';
import { SharedModule } from '../shared/shared.module';
import { NatsModule } from '../transports/nats.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './controller/auth.controller';
import { AuthRepository } from './repository/auth.repository';
import { AuthService } from './service/auth.service';
import { TokenService } from './service/token.service';
import { LoginUseCase } from './service/use-cases/login.use-cases';
import { RefreshTokenUseCase } from './service/use-cases/refresh-token.use-cases';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    LoginUseCase,
    RefreshTokenUseCase,
    AuthRepository,
  ],
  imports: [
    NatsModule,
    SharedModule,
    UsersModule,
    JwtModule.register(jwtConfig),
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
