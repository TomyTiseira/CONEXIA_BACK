import { Module } from '@nestjs/common';
import { NatsModule } from '../transports/nats.module';
import { PaymentAccountController } from './controller/payment-account.controller';
import { PaymentAccountService } from './service/payment-account.service';

@Module({
  imports: [NatsModule],
  controllers: [PaymentAccountController],
  providers: [PaymentAccountService],
})
export class PaymentAccountsModule {}
