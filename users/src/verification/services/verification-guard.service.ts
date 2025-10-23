import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../shared/entities/user.entity';
import {
  UserNotFoundException,
  UserNotVerifiedException,
} from '../exceptions/verification.exceptions';

@Injectable()
export class VerificationGuardService {
  private readonly logger = new Logger(VerificationGuardService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Valida que el usuario esté verificado
   * Lanza una excepción si el usuario no está verificado o no existe
   */
  async validateUserIsVerified(userId: number): Promise<void> {
    this.logger.log(`Validating verification status for user ${userId}`);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'verified'],
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found`);
      throw new UserNotFoundException(userId);
    }

    if (!user.verified) {
      this.logger.warn(`User ${userId} is not verified`);
      throw new UserNotVerifiedException();
    }

    this.logger.log(`User ${userId} is verified`);
  }

  /**
   * Verifica si un usuario está verificado sin lanzar excepciones
   */
  async isUserVerified(userId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'verified'],
    });

    return user?.verified || false;
  }
}
