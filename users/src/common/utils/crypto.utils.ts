import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { envs } from '../../config/envs';

export class CryptoUtils {
  private static readonly SALT_ROUNDS = 10;
  private static readonly ENCRYPTION_KEY = envs.encryptionKey;
  private static readonly ALGORITHM = envs.algorithm;

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
   * Extrae los últimos 4 dígitos de un CBU o CVU
   * @param cbu - CBU o CVU del cual extraer los últimos 4 dígitos
   * @returns Los últimos 4 dígitos como string
   */
  static getLastFourDigits(cbu: string): string {
    if (!cbu || typeof cbu !== 'string') return '';

    // Remover espacios y guiones
    const cleanCbu = cbu.replace(/[\s-]/g, '');

    // Retornar los últimos 4 dígitos
    return cleanCbu.slice(-4);
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

  /**
   * Cifra un texto usando AES-256-CBC
   * @param text - Texto a cifrar
   * @returns Texto cifrado en formato base64
   */
  static encrypt(text: string): string {
    if (!text) return '';

    const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Combinar IV y texto cifrado
    const combined = iv.toString('hex') + ':' + encrypted;
    return Buffer.from(combined).toString('base64');
  }

  /**
   * Descifra un texto usando AES-256-CBC
   * @param encryptedText - Texto cifrado en formato base64
   * @returns Texto descifrado
   */
  static decrypt(encryptedText: string): string {
    if (!encryptedText) return '';

    try {
      const combined = Buffer.from(encryptedText, 'base64').toString('utf8');
      const [ivHex, encrypted] = combined.split(':');

      const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch {
      // Si hay error al descifrar, retornar el texto original (para compatibilidad con datos existentes)
      return encryptedText;
    }
  }
}
