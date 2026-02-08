import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { VerificationGuardService } from '../services/verification-guard.service';

@Controller()
export class VerificationGuardController {
  private readonly logger = new Logger(VerificationGuardController.name);

  constructor(
    private readonly verificationGuardService: VerificationGuardService,
  ) {}

  @MessagePattern('validateUserIsVerified')
  async validateUserIsVerified(@Payload() data: { userId: number }) {
    this.logger.log(`Validating user ${data.userId} is verified`);
    await this.verificationGuardService.validateUserIsVerified(data.userId);
    return { verified: true };
  }

  @MessagePattern('isUserVerified')
  async isUserVerified(@Payload() data: { userId: number }) {
    this.logger.log(`Checking if user ${data.userId} is verified`);
    const isVerified = await this.verificationGuardService.isUserVerified(
      data.userId,
    );
    return isVerified;
  }
}
