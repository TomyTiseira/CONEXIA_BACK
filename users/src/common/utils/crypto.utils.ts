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

  /**
   * Valida formato de CBU (Clave Bancaria Uniforme)
   * @param cbu - CBU a validar (debe tener exactamente 22 dígitos)
   */
  static validateCBU(cbu: string): boolean {
    if (!cbu || typeof cbu !== 'string') return false;

    // Remover espacios y guiones
    const cleanCbu = cbu.replace(/[\s-]/g, '');

    // Debe tener exactamente 22 dígitos
    if (cleanCbu.length !== 22) return false;

    // Debe contener solo números
    if (!/^\d{22}$/.test(cleanCbu)) return false;

    return true;
  }

  /**
   * Valida formato de CVU (Clave Virtual Uniforme)
   * @param cvu - CVU a validar (debe tener exactamente 22 dígitos)
   */
  static validateCVU(cvu: string): boolean {
    if (!cvu || typeof cvu !== 'string') return false;

    // Remover espacios y guiones
    const cleanCvu = cvu.replace(/[\s-]/g, '');

    // Debe tener exactamente 22 dígitos
    if (cleanCvu.length !== 22) return false;

    // Debe contener solo números
    if (!/^\d{22}$/.test(cleanCvu)) return false;

    return true;
  }

  /**
   * Valida formato de alias bancario
   * @param alias - Alias a validar (entre 6 y 20 caracteres, solo letras, números, guiones y puntos)
   */
  static validateAlias(alias: string): boolean {
    if (!alias || typeof alias !== 'string') return false;

    // Debe tener entre 6 y 20 caracteres
    if (alias.length < 6 || alias.length > 20) return false;

    // Solo letras, números, guiones y puntos
    if (!/^[a-zA-Z0-9.-]+$/.test(alias)) return false;

    return true;
  }

  /**
   * Valida formato de CUIT/CUIL
   * @param cuilCuit - CUIT/CUIL a validar (formato XX-XXXXXXXX-X)
   */
  static validateCuilCuit(cuilCuit: string): boolean {
    if (!cuilCuit || typeof cuilCuit !== 'string') return false;

    // Formato: XX-XXXXXXXX-X
    const cuilCuitRegex = /^\d{2}-\d{8}-\d{1}$/;
    if (!cuilCuitRegex.test(cuilCuit)) return false;

    // Validar dígito verificador
    const digits = cuilCuit.replace(/-/g, '');
    const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(digits[i]) * multipliers[i];
    }

    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? remainder : 11 - remainder;

    return checkDigit === parseInt(digits[10]);
  }
}
