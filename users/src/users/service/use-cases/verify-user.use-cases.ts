import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    @InjectRepository(DocumentType)
    private readonly documentTypeRepository: Repository<DocumentType>,
  ) {}

  async execute(email: string, verificationCode: string): Promise<User> {
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

      // Crear perfil vacío para el usuario
      console.log('creating profile for user:', validatedUser.id);
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
      console.log('profile created successfully:', emptyProfile.id);

      // Actualizar el usuario con el ID del perfil creado
      const finalUser = await this.userRepository.update(validatedUser.id, {
        profileId: emptyProfile.id,
      });
      console.log('user updated with profile:', finalUser?.id);

      return finalUser || validatedUser;
    } catch (error) {
      console.error('error creating profile:', error);
      throw error;
    }
  }
}
