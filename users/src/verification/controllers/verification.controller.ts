import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { VerifyIdentityDto } from '../dto/verify-identity.dto';
import { VerificationService } from '../services/verification.service';

@Controller()
export class VerificationController {
  private readonly logger = new Logger(VerificationController.name);

  constructor(private readonly verificationService: VerificationService) {}

  @MessagePattern('verifyIdentity')
  async verifyIdentity(@Payload() data: VerifyIdentityDto) {
    this.logger.log(`Received verification request for user ${data.userId}`);
    return await this.verificationService.verifyIdentity(data);
  }

  @MessagePattern('getVerificationHistory')
  async getVerificationHistory(@Payload() data: { userId: number }) {
    this.logger.log(`Getting verification history for user ${data.userId}`);
    return await this.verificationService.getVerificationHistory(data.userId);
  }

  @MessagePattern('getVerificationStatus')
  async getVerificationStatus(@Payload() data: { userId: number }) {
    this.logger.log(`Getting verification status for user ${data.userId}`);
    return await this.verificationService.getVerificationStatus(data.userId);
  }
}
