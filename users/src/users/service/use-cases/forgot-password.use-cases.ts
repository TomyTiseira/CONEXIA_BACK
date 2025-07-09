import { Injectable } from '@nestjs/common';
import { MockEmailService } from '../../../common/services/mock-email.service';
import { UserBaseService } from '../../../common/services/user-base.service';
import { UserRepository } from '../../repository/users.repository';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userBaseService: UserBaseService,
    private readonly emailService: MockEmailService,
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.userBaseService.validateUserExists(email);

    const userToUpdate = this.userBaseService.prepareUserForPasswordReset(user);

    await this.userRepository.update(user.id, {
      passwordResetCode: userToUpdate.passwordResetCode,
      passwordResetCodeExpires: userToUpdate.passwordResetCodeExpires,
    });

    await this.emailService.sendPasswordResetEmail(
      user.email,
      userToUpdate.passwordResetCode,
    );
  }
}
