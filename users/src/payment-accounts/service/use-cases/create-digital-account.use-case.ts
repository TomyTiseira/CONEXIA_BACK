import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DigitalPlatformNotFoundException,
  InvalidAliasException,
  InvalidCVUException,
  InvalidCuilCuitException,
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

    // Verificar que el usuario no tenga ya una cuenta con el mismo CVU o alias
    // Como los datos están encriptados, necesitamos obtener las cuentas del usuario y comparar
    const userAccounts =
      await this.paymentAccountRepository.findByUserId(userId);

    const duplicateAccount = userAccounts.find((account) => {
      try {
        const decryptedCbu = CryptoUtils.decrypt(account.cbu);
        const decryptedAlias = CryptoUtils.decrypt(account.alias);

        // Verificar si el CVU o el alias coinciden
        const cvuMatches = decryptedCbu === createDigitalAccountDto.cvu;
        const aliasMatches = decryptedAlias === createDigitalAccountDto.alias;

        return cvuMatches || aliasMatches;
      } catch {
        return false;
      }
    });

    if (duplicateAccount) {
      throw new PaymentAccountAlreadyExistsException(
        'Ya tienes una cuenta digital registrada con este CVU o alias',
      );
    }

    // Cifrar datos sensibles
    const encryptedCvu = CryptoUtils.encrypt(createDigitalAccountDto.cvu);
    const encryptedAlias = CryptoUtils.encrypt(createDigitalAccountDto.alias);
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
    // Validar formato de CVU
    if (!CryptoUtils.validateCVU(dto.cvu)) {
      throw new InvalidCVUException(dto.cvu);
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
