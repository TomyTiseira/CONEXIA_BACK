import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DigitalPlatformNotFoundException,
  InvalidAliasException,
  InvalidCVUException,
  InvalidCuilCuitException,
  MissingPaymentAccountDataException,
  PaymentAccountAlreadyExistsException,
} from '../../../common/exceptions/payment-account.exceptions';
import { CryptoUtils } from '../../../common/utils/crypto.utils';
import { DigitalPlatform } from '../../../shared/entities/digital-platform.entity';
import {
  PaymentAccount,
  PaymentAccountType,
} from '../../../shared/entities/payment-account.entity';
import { CreateDigitalAccountDto } from '../../dto/create-digital-account.dto';
import { PaymentAccountResponseDto } from '../../dto/payment-account-response.dto';
import { PaymentAccountRepository } from '../../repository/payment-account.repository';

@Injectable()
export class CreateDigitalAccountUseCase {
  constructor(
    private readonly paymentAccountRepository: PaymentAccountRepository,
    @InjectRepository(DigitalPlatform)
    private readonly digitalPlatformRepository: Repository<DigitalPlatform>,
  ) {}

  async execute(
    userId: number,
    createDigitalAccountDto: CreateDigitalAccountDto,
  ): Promise<PaymentAccountResponseDto> {
    // Validar formato de datos
    this.validateDigitalAccountData(createDigitalAccountDto);

    // Verificar que la plataforma digital existe
    const digitalPlatform = await this.digitalPlatformRepository.findOne({
      where: { id: createDigitalAccountDto.digitalPlatformId, isActive: true },
    });
    if (!digitalPlatform) {
      throw new DigitalPlatformNotFoundException(
        createDigitalAccountDto.digitalPlatformId,
      );
    }

    // Verificar que no existe una cuenta con el mismo CVU o alias
    const existingAccount =
      await this.paymentAccountRepository.findByCbuOrAlias(
        createDigitalAccountDto.cvu,
        createDigitalAccountDto.alias,
      );
    if (existingAccount) {
      const identifier =
        createDigitalAccountDto.alias || createDigitalAccountDto.cvu;
      throw new PaymentAccountAlreadyExistsException(identifier);
    }

    // Cifrar datos sensibles
    const encryptedCvu = CryptoUtils.encrypt(createDigitalAccountDto.cvu);
    const encryptedAlias = createDigitalAccountDto.alias
      ? CryptoUtils.encrypt(createDigitalAccountDto.alias)
      : undefined;
    const encryptedCuilCuit = CryptoUtils.encrypt(
      createDigitalAccountDto.cuilCuit,
    );

    // Crear la cuenta digital
    const paymentAccount = await this.paymentAccountRepository.create({
      type: PaymentAccountType.DIGITAL_ACCOUNT,
      digitalPlatformId: createDigitalAccountDto.digitalPlatformId,
      cbu: encryptedCvu, // Usamos el campo cbu para almacenar CVU cifrado
      alias: encryptedAlias,
      customName: createDigitalAccountDto.customName,
      accountHolderName: createDigitalAccountDto.accountHolderName,
      cuilCuit: encryptedCuilCuit,
      userId,
      isActive: true,
      isVerified: false, // Requiere verificación manual
    });

    return this.mapToResponseDto(paymentAccount, digitalPlatform);
  }

  private validateDigitalAccountData(dto: CreateDigitalAccountDto): void {
    // Validar que se proporcione CVU o alias
    if (!dto.cvu && !dto.alias) {
      throw new MissingPaymentAccountDataException();
    }

    // Validar formato de CVU si se proporciona
    if (dto.cvu && !CryptoUtils.validateCVU(dto.cvu)) {
      throw new InvalidCVUException(dto.cvu);
    }

    // Validar formato de alias si se proporciona
    if (dto.alias && !CryptoUtils.validateAlias(dto.alias)) {
      throw new InvalidAliasException(dto.alias);
    }

    // Validar formato de CUIL/CUIT
    if (!CryptoUtils.validateCuilCuit(dto.cuilCuit)) {
      throw new InvalidCuilCuitException(dto.cuilCuit);
    }
  }

  private mapToResponseDto(
    paymentAccount: PaymentAccount,
    digitalPlatform: DigitalPlatform,
  ): PaymentAccountResponseDto {
    return {
      id: paymentAccount.id,
      type: paymentAccount.type,
      bankId: paymentAccount.bankId,
      bankName: undefined,
      bankAccountType: paymentAccount.bankAccountType,
      digitalPlatformId: paymentAccount.digitalPlatformId,
      digitalPlatformName: digitalPlatform?.name,
      cbu: paymentAccount.cbu, // En la respuesta mostramos el CVU cifrado
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
