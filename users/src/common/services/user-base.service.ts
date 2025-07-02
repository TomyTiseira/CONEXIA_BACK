import { Injectable } from '@nestjs/common';
import { ROLES } from '../../users/constants';
import { Users } from '../../users/entities/users.entity';
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
  async findByEmail(email: string): Promise<Users | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Busca un usuario por ID
   */
  async findById(id: number): Promise<Users | null> {
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
  async validateUserExists(email: string): Promise<Users> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new UserNotFoundException(email);
    }
    return user;
  }

  /**
   * Valida que un usuario no esté activo
   */
  validateUserNotActive(user: Users): void {
    if (user.isValidate) {
      throw new UserAlreadyActiveException(user.email);
    }
  }

  /**
   * Valida un código de verificación
   */
  validateVerificationCode(user: Users, verificationCode: string): void {
    if (user.verificationCode !== verificationCode) {
      throw new InvalidVerificationCodeException();
    }
  }

  /**
   * Valida que un código de verificación no haya expirado
   */
  validateVerificationCodeNotExpired(user: Users): void {
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
   * Prepara datos de usuario para creación con verificación
   */
  async prepareUserForCreation(userData: Partial<Users>) {
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

    return {
      ...userData,
      password: hashedPassword,
      isValidate: false,
      verificationCode,
      verificationCodeExpires,
      roleId: userRole.id, // Asignar rol de usuario regular por defecto
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
  validateUserActivation(updatedUser: Users | null): Users {
    if (!updatedUser) {
      throw new UserActivationFailedException();
    }
    return updatedUser;
  }

  /**
   * Valida que la actualización del código de verificación fue exitosa
   */
  validateVerificationCodeUpdate(updatedUser: Users | null): Users {
    if (!updatedUser) {
      throw new VerificationCodeUpdateFailedException();
    }
    return updatedUser;
  }
}
