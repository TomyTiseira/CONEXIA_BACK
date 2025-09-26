import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bank } from '../shared/entities/bank.entity';
import { DigitalPlatform } from '../shared/entities/digital-platform.entity';
import { PaymentAccount } from '../shared/entities/payment-account.entity';
import { PaymentAccountController } from './controller/payment-account.controller';
import { PaymentAccountRepository } from './repository/payment-account.repository';
import { PaymentAccountService } from './service/payment-account.service';
import { CreateBankAccountUseCase } from './service/use-cases/create-bank-account.use-case';
import { CreateDigitalAccountUseCase } from './service/use-cases/create-digital-account.use-case';
import { DeletePaymentAccountUseCase } from './service/use-cases/delete-payment-account.use-case';
import { GetBanksUseCase } from './service/use-cases/get-banks.use-case';
import { GetDigitalPlatformsUseCase } from './service/use-cases/get-digital-platforms.use-case';
import { GetPaymentAccountByIdUseCase } from './service/use-cases/get-payment-account-by-id.use-case';
import { GetUserPaymentAccountsUseCase } from './service/use-cases/get-user-payment-accounts.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentAccount, Bank, DigitalPlatform])],
  controllers: [PaymentAccountController],
  providers: [
    PaymentAccountService,
    PaymentAccountRepository,
    CreateBankAccountUseCase,
    CreateDigitalAccountUseCase,
    GetUserPaymentAccountsUseCase,
    GetPaymentAccountByIdUseCase,
    DeletePaymentAccountUseCase,
    GetBanksUseCase,
    GetDigitalPlatformsUseCase,
  ],
  exports: [PaymentAccountService, PaymentAccountRepository],
})
export class PaymentAccountsModule {}
