import { Injectable } from '@nestjs/common';
import {
  InvalidAliasException,
  PaymentAccountNotFoundException,
} from '../../../common/exceptions/payment-account.exceptions';
import { CryptoUtils } from '../../../common/utils/crypto.utils';
import { PaymentAccountResponseDto } from '../../dto/payment-account-response.dto';
import { UpdatePaymentAccountDto } from '../../dto/update-payment-account.dto';
import { PaymentAccountRepository } from '../../repository/payment-account.repository';

@Injectable()
export class UpdatePaymentAccountUseCase {
  constructor(
    private readonly paymentAccountRepository: PaymentAccountRepository,
  ) {}

  async execute(
    id: number,
    userId: number,
    updatePaymentAccountDto: UpdatePaymentAccountDto,
  ): Promise<PaymentAccountResponseDto> {
    // Buscar la cuenta
    const paymentAccount = await this.paymentAccountRepository.findById(id);

    if (!paymentAccount || paymentAccount.userId !== userId) {
      throw new PaymentAccountNotFoundException(id);
    }

    // Validar formato de alias
    if (!CryptoUtils.validateAlias(updatePaymentAccountDto.alias)) {
      throw new InvalidAliasException(updatePaymentAccountDto.alias);
    }

    // Verificar que no exista otra cuenta del usuario con el mismo alias
    const userAccounts =
      await this.paymentAccountRepository.findByUserId(userId);

    const duplicateAlias = userAccounts.find((account) => {
      // Ignorar la cuenta actual
      if (account.id === id) return false;

      try {
        const decryptedAlias = CryptoUtils.decrypt(account.alias);
        return decryptedAlias === updatePaymentAccountDto.alias;
      } catch {
        return false;
      }
    });

    if (duplicateAlias) {
      throw new InvalidAliasException('Ya tienes otra cuenta con este alias');
    }

    // Encriptar el nuevo alias
    const encryptedAlias = CryptoUtils.encrypt(updatePaymentAccountDto.alias);

    // Actualizar la cuenta
    const updatedAccount = await this.paymentAccountRepository.update(id, {
      alias: encryptedAlias,
      customName: updatePaymentAccountDto.customName,
    });

    if (!updatedAccount) {
      throw new PaymentAccountNotFoundException(id);
    }

    return {
      id: updatedAccount.id,
      type: updatedAccount.type,
      bankId: updatedAccount.bankId,
      bankName: updatedAccount.bank?.name,
      bankAccountType: updatedAccount.bankAccountType,
      digitalPlatformId: updatedAccount.digitalPlatformId,
      digitalPlatformName: updatedAccount.digitalPlatform?.name,
      cbu: updatedAccount.cbu,
      alias: updatedAccount.alias,
      customName: updatedAccount.customName,
      accountHolderName: updatedAccount.accountHolderName,
      cuilCuit: updatedAccount.cuilCuit,
      isActive: updatedAccount.isActive,
      isVerified: updatedAccount.isVerified,
      createdAt: updatedAccount.createdAt,
      updatedAt: updatedAccount.updatedAt,
    };
  }
}
