import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ROLES } from 'src/auth/constants/role-ids';
import { AuthRoles } from '../../auth/decorators/auth-roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { AutoRefreshJwtGuard } from '../../auth/guards/auto-refresh-jwt.guard';
import { RoleGuard } from '../../auth/guards/role.guard';
import { BankResponseDto } from '../dto/bank-response.dto';
import { CreateBankAccountDto } from '../dto/create-bank-account.dto';
import { CreateDigitalAccountDto } from '../dto/create-digital-account.dto';
import { PaymentAccountResponseDto } from '../dto/payment-account-response.dto';
import { PaymentAccountService } from '../service/payment-account.service';
import { DigitalPlatformResponseDto } from '../dto/digital-platform-response.dto';

@Controller('payment-accounts')
@UseGuards(AutoRefreshJwtGuard, RoleGuard)
@AuthRoles([ROLES.USER])
export class PaymentAccountController {
  constructor(private readonly paymentAccountService: PaymentAccountService) {}

  @Post('bank-account')
  async createBankAccount(
    @User('id') userId: number,
    @Body() createBankAccountDto: CreateBankAccountDto,
  ): Promise<PaymentAccountResponseDto> {
    return await this.paymentAccountService.createBankAccount(
      userId,
      createBankAccountDto,
    );
  }

  @Post('digital-account')
  async createDigitalAccount(
    @User('id') userId: number,
    @Body() createDigitalAccountDto: CreateDigitalAccountDto,
  ): Promise<PaymentAccountResponseDto> {
    return await this.paymentAccountService.createDigitalAccount(
      userId,
      createDigitalAccountDto,
    );
  }

  @Get()
  async getUserPaymentAccounts(
    @User('id') userId: number,
  ): Promise<PaymentAccountResponseDto[]> {
    return await this.paymentAccountService.getUserPaymentAccounts(userId);
  }

  @Get(':id')
  async getPaymentAccountById(
    @Param('id') id: number,
    @User('id') userId: number,
  ): Promise<PaymentAccountResponseDto> {
    return await this.paymentAccountService.getPaymentAccountById(id, userId);
  }

  @Delete(':id')
  async deletePaymentAccount(
    @Param('id') id: number,
    @User('id') userId: number,
  ): Promise<void> {
    return await this.paymentAccountService.deletePaymentAccount(id, userId);
  }

  @Get('banks')
  async getBanks(): Promise<BankResponseDto[]> {
    return await this.paymentAccountService.getBanks();
  }

  @Get('digital-platforms')
  async getDigitalPlatforms(): Promise<DigitalPlatformResponseDto[]> {
    return await this.paymentAccountService.getDigitalPlatforms();
  }
}
