import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BankNotFoundException,
  InvalidAliasException,
  InvalidCBUException,
  InvalidCuilCuitException,
  PaymentAccountAlreadyExistsException,
} from '../../../common/exceptions/payment-account.exceptions';
import { CryptoUtils } from '../../../common/utils/crypto.utils';
import { Bank } from '../../../shared/entities/bank.entity';
import {
  PaymentAccount,
  PaymentAccountType,
} from '../../../shared/entities/payment-account.entity';
import { CreateBankAccountDto } from '../../dto/create-bank-account.dto';
import { PaymentAccountResponseDto } from '../../dto/payment-account-response.dto';
import { PaymentAccountRepository } from '../../repository/payment-account.repository';

@Injectable()
export class CreateBankAccountUseCase {
  constructor(
    private readonly paymentAccountRepository: PaymentAccountRepository,
    @InjectRepository(Bank)
    private readonly bankRepository: Repository<Bank>,
  ) {}

  async execute(
    userId: number,
    createBankAccountDto: CreateBankAccountDto,
  ): Promise<PaymentAccountResponseDto> {
    // Validar formato de datos
    this.validateBankAccountData(createBankAccountDto);

    // Verificar que el banco existe
    const bank = await this.bankRepository.findOne({
      where: { id: createBankAccountDto.bankId, isActive: true },
    });
    if (!bank) {
      throw new BankNotFoundException(createBankAccountDto.bankId);
    }

    // Verificar que el usuario no tenga ya una cuenta con el mismo CBU o alias
    // Como los datos están encriptados, necesitamos obtener las cuentas del usuario y comparar
    const userAccounts =
      await this.paymentAccountRepository.findByUserId(userId);
    const duplicateAccount = userAccounts.find((account) => {
      try {
        const decryptedCbu = CryptoUtils.decrypt(account.cbu);
        const decryptedAlias = CryptoUtils.decrypt(account.alias);

        // Verificar si el CBU o el alias coinciden
        const cbuMatches = decryptedCbu === createBankAccountDto.cbu;
        const aliasMatches = decryptedAlias === createBankAccountDto.alias;

        return cbuMatches || aliasMatches;
      } catch {
        return false;
      }
    });

    if (duplicateAccount) {
      throw new PaymentAccountAlreadyExistsException(
        'already exists with this cbu or alias',
      );
    }

    // Cifrar datos sensibles
    const encryptedCbu = CryptoUtils.encrypt(createBankAccountDto.cbu);
    const encryptedAlias = CryptoUtils.encrypt(createBankAccountDto.alias);
    const encryptedCuilCuit = CryptoUtils.encrypt(
      createBankAccountDto.cuilCuit,
    );

    // Crear la cuenta bancaria
    const paymentAccount = await this.paymentAccountRepository.create({
      type: PaymentAccountType.BANK_ACCOUNT,
      bankId: createBankAccountDto.bankId,
      bankAccountType: createBankAccountDto.bankAccountType,
      cbu: encryptedCbu,
      alias: encryptedAlias,
      customName: createBankAccountDto.customName,
      accountHolderName: createBankAccountDto.accountHolderName,
      cuilCuit: encryptedCuilCuit,
      userId,
      isActive: true,
      isVerified: false, // Requiere verificación manual
    });

    return this.mapToResponseDto(paymentAccount, bank);
  }

  private validateBankAccountData(dto: CreateBankAccountDto): void {
    // Validar formato de CBU
    if (!CryptoUtils.validateCBU(dto.cbu)) {
      throw new InvalidCBUException(dto.cbu);
    }

    // Validar formato de alias
    if (!CryptoUtils.validateAlias(dto.alias)) {
      throw new InvalidAliasException(dto.alias);
    }

    // Validar formato de CUIL/CUIT
    if (!CryptoUtils.validateCuilCuit(dto.cuilCuit)) {
      throw new InvalidCuilCuitException(dto.cuilCuit);
    }
  }

  private mapToResponseDto(
    paymentAccount: PaymentAccount,
    bank: Bank,
  ): PaymentAccountResponseDto {
    return {
      id: paymentAccount.id,
      type: paymentAccount.type,
      bankId: paymentAccount.bankId,
      bankName: bank?.name,
      bankAccountType: paymentAccount.bankAccountType,
      digitalPlatformId: paymentAccount.digitalPlatformId,
      digitalPlatformName: undefined,
      cbu: paymentAccount.cbu, // En la respuesta mostramos el CBU cifrado
      alias: paymentAccount.alias,
      customName: paymentAccount.customName,
      accountHolderName: paymentAccount.accountHolderName,
      cuilCuit: paymentAccount.cuilCuit, // En la respuesta mostramos el CUIL/CUIT cifrado
      isActive: paymentAccount.isActive,
      isVerified: paymentAccount.isVerified,
      createdAt: paymentAccount.createdAt,
      updatedAt: paymentAccount.updatedAt,
    };
  }
}
