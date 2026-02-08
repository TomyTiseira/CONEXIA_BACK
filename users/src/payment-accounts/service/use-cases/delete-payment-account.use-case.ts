import { Injectable } from '@nestjs/common';
import { PaymentAccountNotFoundException } from '../../../common/exceptions/payment-account.exceptions';
import { PaymentAccountRepository } from '../../repository/payment-account.repository';

@Injectable()
export class DeletePaymentAccountUseCase {
  constructor(
    private readonly paymentAccountRepository: PaymentAccountRepository,
  ) {}

  async execute(id: number, userId: number): Promise<void> {
    const paymentAccount = await this.paymentAccountRepository.findById(id);

    if (!paymentAccount || paymentAccount.userId !== userId) {
      throw new PaymentAccountNotFoundException(id);
    }

    await this.paymentAccountRepository.softDelete(id);
  }
}
