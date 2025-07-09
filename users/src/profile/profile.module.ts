import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../shared/shared.module';
import { ProfileController } from './controller/profile.controller';
import { Profile } from './entities/profile.entity';
import { ProfileRepository } from './repository/profile.repository';
import { ProfileService } from './service/profile.service';
import { GetProfileUseCase } from './service/use-cases/get-profile.use-cases';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([Profile])],
  controllers: [ProfileController],
  providers: [ProfileService, ProfileRepository, GetProfileUseCase],
  exports: [ProfileRepository, ProfileService],
})
export class ProfileModule {}
