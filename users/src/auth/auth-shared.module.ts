import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../config/jwt.config';
import { TokenService } from './service/token.service';

@Module({
  imports: [JwtModule.register(jwtConfig)],
  providers: [TokenService],
  exports: [TokenService, JwtModule],
})
export class AuthSharedModule {}
