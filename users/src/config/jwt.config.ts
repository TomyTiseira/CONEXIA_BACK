import { envs } from './envs';

export const jwtConfig = {
  secret: envs.jwtSecret,
  signOptions: {
    expiresIn: 60 * 15, // 15 minutos en segundos
  },
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
  },
  accessTokenConfig: {
    expiresIn: 60 * 15, // 15 minutos
  },
  refreshTokenConfig: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
  },
};
