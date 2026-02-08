import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { NATS_SERVICE } from '../../config';
import { BankResponseDto } from '../dto/bank-response.dto';
import { CreateBankAccountDto } from '../dto/create-bank-account.dto';
import { CreateDigitalAccountDto } from '../dto/create-digital-account.dto';
import { DigitalPlatformResponseDto } from '../dto/digital-platform-response.dto';
import { PaymentAccountResponseDto } from '../dto/payment-account-response.dto';
import { UpdatePaymentAccountDto } from '../dto/update-payment-account.dto';

@Injectable()
export class PaymentAccountService {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  async createBankAccount(
    userId: number,
    createBankAccountDto: CreateBankAccountDto,
  ): Promise<PaymentAccountResponseDto> {
    return await this.client
      .send('payment-account.create-bank-account', {
        userId,
        createBankAccountDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      )
      .toPromise();
  }

  async createDigitalAccount(
    userId: number,
    createDigitalAccountDto: CreateDigitalAccountDto,
  ): Promise<PaymentAccountResponseDto> {
    return await this.client
      .send('payment-account.create-digital-account', {
        userId,
        createDigitalAccountDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      )
      .toPromise();
  }

  async getUserPaymentAccounts(
    userId: number,
  ): Promise<PaymentAccountResponseDto[]> {
    return await this.client
      .send('payment-account.get-user-accounts', userId)
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      )
      .toPromise();
  }

  async getPaymentAccountById(
    id: number,
    userId: number,
  ): Promise<PaymentAccountResponseDto> {
    return await this.client
      .send('payment-account.get-by-id', { id, userId })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      )
      .toPromise();
  }

  async deletePaymentAccount(id: number, userId: number): Promise<void> {
    return await this.client
      .send('payment-account.delete', { id, userId })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      )
      .toPromise();
  }

  async getBanks(): Promise<BankResponseDto[]> {
    return await this.client
      .send('payment-account.get-banks', {})
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      )
      .toPromise();
  }

  async getDigitalPlatforms(): Promise<DigitalPlatformResponseDto[]> {
    return await this.client
      .send('payment-account.get-digital-platforms', {})
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      )
      .toPromise();
  }

  async updatePaymentAccount(
    id: number,
    userId: number,
    updatePaymentAccountDto: UpdatePaymentAccountDto,
  ): Promise<PaymentAccountResponseDto> {
    return await this.client
      .send('payment-account.update', {
        id,
        userId,
        updatePaymentAccountDto,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      )
      .toPromise();
  }
}
