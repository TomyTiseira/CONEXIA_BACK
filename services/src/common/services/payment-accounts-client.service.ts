/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { USERS_SERVICE } from '../../config';

export interface PaymentAccountInfo {
  id: number;
  type: 'bank_account' | 'digital_account';
  bankId?: number;
  bankName?: string;
  bankAccountType?: 'savings' | 'checking';
  digitalPlatformId?: number;
  digitalPlatformName?: string;
  cbu: string;
  alias?: string;
  customName?: string;
  accountHolderName: string;
  cuilCuit: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PaymentAccountsClientService {
  constructor(@Inject(USERS_SERVICE) private readonly client: ClientProxy) {}

  async getUserPaymentAccounts(userId: number): Promise<PaymentAccountInfo[]> {
    try {
      const accounts = await firstValueFrom(
        this.client.send('payment-account.get-user-accounts', userId),
      );
      return accounts || [];
    } catch (error) {
      console.error('Error getting user payment accounts:', error);
      return [];
    }
  }

  async hasActivePaymentAccount(userId: number): Promise<boolean> {
    try {
      const accounts = await this.getUserPaymentAccounts(userId);
      return accounts.some((account) => account.isActive);
    } catch (error) {
      console.error('Error checking active payment accounts:', error);
      return false;
    }
  }
}
