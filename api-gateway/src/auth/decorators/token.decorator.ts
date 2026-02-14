import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Decorador genérico para extraer tokens de cookies
 * @param tokenName - Nombre del token en las cookies
 * @returns El valor del token
 *
 * @example
 * // En un controlador:
 * @Post('reset-password')
 * resetPassword(
 *   @Body() resetPasswordDto: ResetPasswordDto,
 *   @Token('password_reset_token') resetToken: string,
 * ) {
 *   // resetToken contiene el valor de la cookie password_reset_token
 * }
 */
export const Token = createParamDecorator(
  (tokenName: string, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const cookies = request.cookies as Record<string, string> | undefined;
    const token = cookies?.[tokenName];

    if (!token) {
      throw new UnauthorizedException(`${tokenName} not found in cookies`);
    }

    return token;
  },
);

/**
 * Decorador para extraer el access token de las cookies
 * @returns El access token
 */
export const AccessToken = () => Token('access_token');

/**
 * Decorador para extraer el refresh token de las cookies
 * @returns El refresh token
 */
export const RefreshToken = () => Token('refresh_token');

/**
 * Decorador para extraer el token de reset de contraseña de las cookies
 * @returns El token de reset de contraseña
 */
export const ResetToken = () => Token('password_reset_token');

/**
 * Decorador para extraer el token de verificación de usuario de las cookies
 * @returns El token de verificación de usuario
 */
export const VerificationToken = () => Token('user_verification_token');
