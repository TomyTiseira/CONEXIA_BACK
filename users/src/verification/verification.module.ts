import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../profile/entities/profile.entity';
import { User } from '../shared/entities/user.entity';
import { VerificationGuardController } from './controllers/verification-guard.controller';
import { VerificationController } from './controllers/verification.controller';
import { UserVerification } from './entities/user-verification.entity';
import { VerificationRepository } from './repository/verification.repository';
import { AwsService } from './services/aws.service';
import { VerificationGuardService } from './services/verification-guard.service';
import { VerificationService } from './services/verification.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserVerification, User, Profile])],
  controllers: [VerificationController, VerificationGuardController],
  providers: [
    VerificationService,
    VerificationRepository,
    AwsService,
    VerificationGuardService,
  ],
  exports: [VerificationService, VerificationGuardService],
})
export class VerificationModule {}
