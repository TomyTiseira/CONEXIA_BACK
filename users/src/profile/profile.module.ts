import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenService } from '../auth/service/token.service';
import { jwtConfig } from '../config/jwt.config';
import { SharedModule } from '../shared/shared.module';
import { UserRepository } from '../users/repository/users.repository';
import { ProfileController } from './controller/profile.controller';
import { Profile } from './entities/profile.entity';
import { ProfileRepository } from './repository/profile.repository';
import { ProfileService } from './service/profile.service';
import { CreateProfileUseCase } from './service/use-cases/create-profile.use-cases';
import { GetProfileUseCase } from './service/use-cases/get-profile.use-cases';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([Profile]),
    JwtModule.register(jwtConfig),
  ],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    ProfileRepository,
    CreateProfileUseCase,
    GetProfileUseCase,
    UserRepository,
    TokenService,
  ],
  exports: [ProfileRepository, ProfileService],
})
export class ProfileModule {}
