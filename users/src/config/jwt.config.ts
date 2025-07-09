import { envs } from './envs';

export const jwtConfig = {
  secret: envs.jwtSecret,
  signOptions: {
    expiresIn: '15m', // Default for access tokens
  },
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
  },
  accessTokenConfig: {
    expiresIn: '15m',
  },
  refreshTokenConfig: {
    expiresIn: '7d',
  },
};
