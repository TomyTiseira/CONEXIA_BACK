import { Injectable } from '@nestjs/common';
import { User } from '../../shared/entities/user.entity';
import { ROLES } from '../../users/constants';
import { UserRepository } from '../../users/repository/users.repository';
import {
  InvalidVerificationCodeException,
  MissingRequiredFieldsException,
  RoleNotFoundException,
  UserActivationFailedException,
  UserAlreadyActiveException,
  UserAlreadyExistsException,
  UserNotFoundException,
  VerificationCodeExpiredException,
  VerificationCodeUpdateFailedException,
} from '../exceptions/user.exceptions';
import { CryptoUtils } from '../utils/crypto.utils';

@Injectable()
export class UserBaseService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Busca un usuario por email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Busca un usuario por ID
   */
  async findById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  /**
   * Verifica si un usuario existe por email
   */
  async userExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return !!user;
  }

  /**
   * Valida que un usuario no exista
   */
  async validateUserDoesNotExist(email: string): Promise<void> {
    const userExists = await this.userExists(email);
    if (userExists) {
      throw new UserAlreadyExistsException(email);
    }
  }

  /**
   * Valida que un usuario exista
   */
  async validateUserExists(email: string): Promise<User> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new UserNotFoundException(email);
    }
    return user;
  }

  /**
   * Valida que un usuario no esté activo
   */
  validateUserNotActive(user: User): void {
    if (user.isValidate) {
      throw new UserAlreadyActiveException(user.email);
    }
  }

  /**
   * Valida un código de verificación
   */
  validateVerificationCode(user: User, verificationCode: string): void {
    if (user.verificationCode !== verificationCode) {
      throw new InvalidVerificationCodeException();
    }
  }

  /**
   * Valida que un código de verificación no haya expirado
   */
  validateVerificationCodeNotExpired(user: User): void {
    if (user.verificationCodeExpires < new Date()) {
      throw new VerificationCodeExpiredException();
    }
  }

  /**
   * Genera datos de verificación para un usuario
   */
  generateVerificationData() {
    return {
      verificationCode: CryptoUtils.generateVerificationCode(),
      verificationCodeExpires: CryptoUtils.calculateExpirationDate(),
    };
  }

  /**
   * Genera datos de verificación para un usuario
   */
  generatePasswordResetData() {
    return {
      passwordResetCode: CryptoUtils.generateVerificationCode(),
      passwordResetCodeExpires: CryptoUtils.calculateExpirationDate(),
    };
  }

  /**
   * Prepara datos de usuario para creación con verificación
   */
  async prepareUserForCreation(
    userData: Partial<User> & { confirmPassword?: string },
  ) {
    if (!userData.password) {
      throw new MissingRequiredFieldsException(['password']);
    }

    const { verificationCode, verificationCodeExpires } =
      this.generateVerificationData();
    const hashedPassword = await CryptoUtils.hashPassword(userData.password);

    // Obtener el ID del rol "user" dinámicamente
    const userRole = await this.userRepository.findRoleByName(ROLES.USER);
    if (!userRole) {
      throw new RoleNotFoundException(ROLES.USER);
    }

    // Extraer solo los campos necesarios para la entidad User, excluyendo confirmPassword
    const userDataWithoutConfirm = { ...userData };
    delete userDataWithoutConfirm.confirmPassword;

    return {
      ...userDataWithoutConfirm,
      password: hashedPassword,
      isValidate: false,
      verificationCode,
      verificationCodeExpires,
      roleId: userRole.id, // Asignar rol de usuario regular por defecto
    };
  }

  prepareUserForPasswordReset(user: User) {
    const { passwordResetCode, passwordResetCodeExpires } =
      this.generatePasswordResetData();
    return {
      ...user,
      passwordResetCode,
      passwordResetCodeExpires,
    };
  }

  /**
   * Prepara datos para activar un usuario
   */
  prepareUserForActivation() {
    return {
      isValidate: true,
      verificationCode: null as string | null,
      verificationCodeExpires: null as Date | null,
    };
  }

  /**
   * Valida que la activación del usuario fue exitosa
   */
  validateUserActivation(updatedUser: User | null): User {
    if (!updatedUser) {
      throw new UserActivationFailedException();
    }
    return updatedUser;
  }

  /**
   * Valida que la actualización del código de verificación fue exitosa
   */
  validateVerificationCodeUpdate(updatedUser: User | null): User {
    if (!updatedUser) {
      throw new VerificationCodeUpdateFailedException();
    }
    return updatedUser;
  }
}
