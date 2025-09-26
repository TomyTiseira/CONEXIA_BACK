import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BankResponseDto } from '../dto/bank-response.dto';
import { CreateBankAccountDto } from '../dto/create-bank-account.dto';
import { CreateDigitalAccountDto } from '../dto/create-digital-account.dto';
import { DigitalPlatformResponseDto } from '../dto/digital-platform-response.dto';
import { PaymentAccountResponseDto } from '../dto/payment-account-response.dto';
import { PaymentAccountService } from '../service/payment-account.service';

@Controller()
export class PaymentAccountController {
  constructor(private readonly paymentAccountService: PaymentAccountService) {}

  @MessagePattern('payment-account.create-bank-account')
  async createBankAccount(
    @Payload()
    data: {
      userId: number;
      createBankAccountDto: CreateBankAccountDto;
    },
  ): Promise<PaymentAccountResponseDto> {
    return await this.paymentAccountService.createBankAccount(
      data.userId,
      data.createBankAccountDto,
    );
  }

  @MessagePattern('payment-account.create-digital-account')
  async createDigitalAccount(
    @Payload()
    data: {
      userId: number;
      createDigitalAccountDto: CreateDigitalAccountDto;
    },
  ): Promise<PaymentAccountResponseDto> {
    return await this.paymentAccountService.createDigitalAccount(
      data.userId,
      data.createDigitalAccountDto,
    );
  }

  @MessagePattern('payment-account.get-user-accounts')
  async getUserPaymentAccounts(
    @Payload() data: number | { userId: number },
  ): Promise<PaymentAccountResponseDto[]> {
    const userId = typeof data === 'number' ? data : data.userId;
    return await this.paymentAccountService.getUserPaymentAccounts(userId);
  }

  @MessagePattern('payment-account.get-by-id')
  async getPaymentAccountById(
    @Payload() data: { id: number; userId: number },
  ): Promise<PaymentAccountResponseDto> {
    return await this.paymentAccountService.getPaymentAccountById(
      data.id,
      data.userId,
    );
  }

  @MessagePattern('payment-account.delete')
  async deletePaymentAccount(
    @Payload() data: { id: number; userId: number },
  ): Promise<void> {
    return await this.paymentAccountService.deletePaymentAccount(
      data.id,
      data.userId,
    );
  }

  @MessagePattern('payment-account.get-banks')
  async getBanks(): Promise<BankResponseDto[]> {
    return await this.paymentAccountService.getBanks();
  }

  @MessagePattern('payment-account.get-digital-platforms')
  async getDigitalPlatforms(): Promise<DigitalPlatformResponseDto[]> {
    return await this.paymentAccountService.getDigitalPlatforms();
  }
}
