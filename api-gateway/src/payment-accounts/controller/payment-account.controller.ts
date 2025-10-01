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
import { AuthenticatedUser } from 'src/common/interfaces/authenticatedRequest.interface';
import { AuthRoles } from '../../auth/decorators/auth-roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { AutoRefreshJwtGuard } from '../../auth/guards/auto-refresh-jwt.guard';
import { RoleGuard } from '../../auth/guards/role.guard';
import { BankResponseDto } from '../dto/bank-response.dto';
import { CreateBankAccountDto } from '../dto/create-bank-account.dto';
import { CreateDigitalAccountDto } from '../dto/create-digital-account.dto';
import { DigitalPlatformResponseDto } from '../dto/digital-platform-response.dto';
import { PaymentAccountResponseDto } from '../dto/payment-account-response.dto';
import { PaymentAccountService } from '../service/payment-account.service';

@Controller('payment-accounts')
@UseGuards(AutoRefreshJwtGuard, RoleGuard)
@AuthRoles([ROLES.USER])
export class PaymentAccountController {
  constructor(private readonly paymentAccountService: PaymentAccountService) {}

  @Post('bank-account')
  async createBankAccount(
    @User() user: AuthenticatedUser,
    @Body() createBankAccountDto: CreateBankAccountDto,
  ): Promise<PaymentAccountResponseDto> {
    return await this.paymentAccountService.createBankAccount(
      user.id,
      createBankAccountDto,
    );
  }

  @Post('digital-account')
  async createDigitalAccount(
    @User() user: AuthenticatedUser,
    @Body() createDigitalAccountDto: CreateDigitalAccountDto,
  ): Promise<PaymentAccountResponseDto> {
    return await this.paymentAccountService.createDigitalAccount(
      user.id,
      createDigitalAccountDto,
    );
  }

  @Get('banks')
  async getBanks(): Promise<BankResponseDto[]> {
    return await this.paymentAccountService.getBanks();
  }

  @Get('digital-platforms')
  async getDigitalPlatforms(): Promise<DigitalPlatformResponseDto[]> {
    return await this.paymentAccountService.getDigitalPlatforms();
  }

  @Get()
  async getUserPaymentAccounts(
    @User() user: AuthenticatedUser,
  ): Promise<PaymentAccountResponseDto[]> {
    return await this.paymentAccountService.getUserPaymentAccounts(user.id);
  }

  @Get(':id')
  async getPaymentAccountById(
    @Param('id') id: number,
    @User() user: AuthenticatedUser,
  ): Promise<PaymentAccountResponseDto> {
    return await this.paymentAccountService.getPaymentAccountById(id, user.id);
  }

  @Delete(':id')
  async deletePaymentAccount(
    @Param('id') id: number,
    @User() user: AuthenticatedUser,
  ): Promise<void> {
    return await this.paymentAccountService.deletePaymentAccount(id, user.id);
  }
}
