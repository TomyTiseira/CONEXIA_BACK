import { Injectable } from '@nestjs/common';
import { PaymentAccountNotFoundException } from '../../../common/exceptions/payment-account.exceptions';
import { PaymentAccountResponseDto } from '../../dto/payment-account-response.dto';
import { PaymentAccountRepository } from '../../repository/payment-account.repository';

@Injectable()
export class GetPaymentAccountByIdUseCase {
  constructor(
    private readonly paymentAccountRepository: PaymentAccountRepository,
  ) {}

  async execute(
    id: number,
    userId: number,
  ): Promise<PaymentAccountResponseDto> {
    const paymentAccount = await this.paymentAccountRepository.findById(id);

    if (!paymentAccount || paymentAccount.userId !== userId) {
      throw new PaymentAccountNotFoundException(id);
    }

    return {
      id: paymentAccount.id,
      type: paymentAccount.type,
      bankId: paymentAccount.bankId,
      bankName: paymentAccount.bank?.name,
      bankAccountType: paymentAccount.bankAccountType,
      digitalPlatformId: paymentAccount.digitalPlatformId,
      digitalPlatformName: paymentAccount.digitalPlatform?.name,
      cbu: paymentAccount.cbu,
      alias: paymentAccount.alias,
      accountHolderName: paymentAccount.accountHolderName,
      cuilCuit: paymentAccount.cuilCuit,
      isActive: paymentAccount.isActive,
      isVerified: paymentAccount.isVerified,
      createdAt: paymentAccount.createdAt,
      updatedAt: paymentAccount.updatedAt,
    };
  }
}
