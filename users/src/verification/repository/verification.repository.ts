import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserVerification } from '../entities/user-verification.entity';

@Injectable()
export class VerificationRepository {
  private readonly logger = new Logger(VerificationRepository.name);

  constructor(
    @InjectRepository(UserVerification)
    private readonly verificationRepository: Repository<UserVerification>,
  ) {}

  async createVerification(
    verificationData: Partial<UserVerification>,
  ): Promise<UserVerification> {
    try {
      const verification = this.verificationRepository.create(verificationData);
      return await this.verificationRepository.save(verification);
    } catch (error) {
      this.logger.error(
        `Error creating verification record: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findByUserId(userId: number): Promise<UserVerification[]> {
    return await this.verificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findLatestByUserId(userId: number): Promise<UserVerification | null> {
    return await this.verificationRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(verificationId: number): Promise<UserVerification | null> {
    return await this.verificationRepository.findOne({
      where: { verificationId },
    });
  }
}
