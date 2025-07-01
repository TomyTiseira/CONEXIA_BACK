import * as bcrypt from 'bcrypt';

export class CryptoUtils {
  private static readonly SALT_ROUNDS = 10;

  /**
   * Encripta una contraseña usando bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compara una contraseña con su hash encriptado
   */
  static async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Genera un código de verificación de 6 dígitos
   */
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Calcula la fecha de expiración para un código de verificación
   * @param minutesFromNow - Minutos desde ahora para la expiración
   */
  static calculateExpirationDate(minutesFromNow: number = 15): Date {
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + minutesFromNow);
    return expirationDate;
  }
}
