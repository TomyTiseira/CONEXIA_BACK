import { Injectable } from '@nestjs/common';
import { PaymentAccountResponseDto } from '../../dto/payment-account-response.dto';
import { PaymentAccountRepository } from '../../repository/payment-account.repository';

@Injectable()
export class GetUserPaymentAccountsUseCase {
  constructor(
    private readonly paymentAccountRepository: PaymentAccountRepository,
  ) {}

  async execute(userId: number): Promise<PaymentAccountResponseDto[]> {
    const paymentAccounts =
      await this.paymentAccountRepository.findByUserId(userId);

    return paymentAccounts.map((account) => ({
      id: account.id,
      type: account.type,
      bankId: account.bankId,
      bankName: account.bank?.name,
      bankAccountType: account.bankAccountType,
      digitalPlatformId: account.digitalPlatformId,
      digitalPlatformName: account.digitalPlatform?.name,
      cbu: account.cbu,
      alias: account.alias,
      accountHolderName: account.accountHolderName,
      cuilCuit: account.cuilCuit,
      isActive: account.isActive,
      isVerified: account.isVerified,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }));
  }
}
