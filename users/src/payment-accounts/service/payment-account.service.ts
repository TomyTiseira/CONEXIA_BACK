import { Injectable } from '@nestjs/common';
import { BankResponseDto } from '../dto/bank-response.dto';
import { CreateBankAccountDto } from '../dto/create-bank-account.dto';
import { CreateDigitalAccountDto } from '../dto/create-digital-account.dto';
import { DigitalPlatformResponseDto } from '../dto/digital-platform-response.dto';
import { PaymentAccountResponseDto } from '../dto/payment-account-response.dto';
import { CreateBankAccountUseCase } from './use-cases/create-bank-account.use-case';
import { CreateDigitalAccountUseCase } from './use-cases/create-digital-account.use-case';
import { DeletePaymentAccountUseCase } from './use-cases/delete-payment-account.use-case';
import { GetBanksUseCase } from './use-cases/get-banks.use-case';
import { GetDigitalPlatformsUseCase } from './use-cases/get-digital-platforms.use-case';
import { GetPaymentAccountByIdUseCase } from './use-cases/get-payment-account-by-id.use-case';
import { GetUserPaymentAccountsUseCase } from './use-cases/get-user-payment-accounts.use-case';

@Injectable()
export class PaymentAccountService {
  constructor(
    private readonly createBankAccountUseCase: CreateBankAccountUseCase,
    private readonly createDigitalAccountUseCase: CreateDigitalAccountUseCase,
    private readonly getUserPaymentAccountsUseCase: GetUserPaymentAccountsUseCase,
    private readonly getPaymentAccountByIdUseCase: GetPaymentAccountByIdUseCase,
    private readonly deletePaymentAccountUseCase: DeletePaymentAccountUseCase,
    private readonly getBanksUseCase: GetBanksUseCase,
    private readonly getDigitalPlatformsUseCase: GetDigitalPlatformsUseCase,
  ) {}

  async createBankAccount(
    userId: number,
    createBankAccountDto: CreateBankAccountDto,
  ): Promise<PaymentAccountResponseDto> {
    return this.createBankAccountUseCase.execute(userId, createBankAccountDto);
  }

  async createDigitalAccount(
    userId: number,
    createDigitalAccountDto: CreateDigitalAccountDto,
  ): Promise<PaymentAccountResponseDto> {
    return this.createDigitalAccountUseCase.execute(
      userId,
      createDigitalAccountDto,
    );
  }

  async getUserPaymentAccounts(
    userId: number,
  ): Promise<PaymentAccountResponseDto[]> {
    return this.getUserPaymentAccountsUseCase.execute(userId);
  }

  async getPaymentAccountById(
    id: number,
    userId: number,
  ): Promise<PaymentAccountResponseDto> {
    return this.getPaymentAccountByIdUseCase.execute(id, userId);
  }

  async deletePaymentAccount(id: number, userId: number): Promise<void> {
    return this.deletePaymentAccountUseCase.execute(id, userId);
  }

  async getBanks(): Promise<BankResponseDto[]> {
    return this.getBanksUseCase.execute();
  }

  async getDigitalPlatforms(): Promise<DigitalPlatformResponseDto[]> {
    return this.getDigitalPlatformsUseCase.execute();
  }
}
