import { Injectable } from '@nestjs/common';
import { CryptoUtils } from '../../../common/utils/crypto.utils';
import { PaymentAccountResponseDto } from '../../dto/payment-account-response.dto';
import { PaymentAccountRepository } from '../../repository/payment-account.repository';

@Injectable()
export class GetUserPaymentAccountsUseCase {
  constructor(
    private readonly paymentAccountRepository: PaymentAccountRepository,
  ) {}

  async execute(userId: number): Promise<Partial<PaymentAccountResponseDto>[]> {
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
      cbu: CryptoUtils.decrypt(account.cbu),
      alias: account.alias ? CryptoUtils.decrypt(account.alias) : undefined,
      customName: account.customName,
      accountHolderName: account.accountHolderName,
      isActive: account.isActive,
      isVerified: account.isVerified,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }));
  }
}
