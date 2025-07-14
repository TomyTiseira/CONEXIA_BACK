import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenService } from '../../../auth/service/token.service';
import { MockEmailService } from '../../../common/services/mock-email.service';
import { UserBaseService } from '../../../common/services/user-base.service';
import { ProfileRepository } from '../../../profile/repository/profile.repository';
import { DocumentType } from '../../../shared/entities/document-type.entity';
import { User } from '../../../shared/entities/user.entity';
import { UserRepository } from '../../repository/users.repository';

@Injectable()
export class VerifyUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userBaseService: UserBaseService,
    private readonly profileRepository: ProfileRepository,
    private readonly emailService: MockEmailService,
    private readonly tokenService: TokenService,
    @InjectRepository(DocumentType)
    private readonly documentTypeRepository: Repository<DocumentType>,
  ) {}

  async execute(
    email: string,
    verificationCode: string,
  ): Promise<{ user: User; token: string }> {
    // Validar que el usuario exista
    const user = await this.userBaseService.validateUserExists(email);

    // Validar que el usuario no esté activo
    this.userBaseService.validateUserNotActive(user);

    // Validar el código de verificación
    this.userBaseService.validateVerificationCode(user, verificationCode);

    // Validar que el código no haya expirado
    this.userBaseService.validateVerificationCodeNotExpired(user);

    // Preparar datos para activar el usuario
    const activationData = this.userBaseService.prepareUserForActivation();

    // Actualizar usuario
    await this.userRepository.update(user.id, {
      isValidate: activationData.isValidate,
    });

    // Limpiar campos de verificación
    const updatedUser = await this.userRepository.clearVerificationFields(
      user.id,
    );

    // Validar que la activación fue exitosa
    const validatedUser =
      this.userBaseService.validateUserActivation(updatedUser);

    try {
      // Obtener el tipo de documento "DNI" dinámicamente
      const otherDocumentType = await this.documentTypeRepository.findOne({
        where: { name: 'DNI' },
      });

      if (!otherDocumentType) {
        throw new Error(
          'No se encontró el tipo de documento "DNI" en la base de datos',
        );
      }

      const emptyProfile = await this.profileRepository.create({
        userId: validatedUser.id,
        name: '',
        lastName: '',
        documentNumber: '',
        documentTypeId: otherDocumentType.id,
        phoneNumber: '',
        country: '',
        state: '',
      });

      const finalUser = await this.userRepository.update(validatedUser.id, {
        profileId: emptyProfile.id,
      });

      // Enviar email de bienvenida después de activar la cuenta exitosamente
      await this.emailService.sendWelcomeEmail(validatedUser.email);

      // Generar token de verificación de usuario
      // Validar que finalUser no sea nulo antes de acceder a sus propiedades
      if (!finalUser) {
        throw new Error('Failed to update user with empty profile');
      }

      const token = this.tokenService.generateUserVerificationToken(
        finalUser.id,
        finalUser.email,
      );

      return {
        user: finalUser,
        token,
      };
    } catch (error) {
      console.error('error creating profile:', error);
      throw error;
    }
  }
}
