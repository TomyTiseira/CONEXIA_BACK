import { envs } from './envs';
import { CookieOptions } from 'express';

export const jwtConfig = {
  secret: envs.jwtSecret,
  signOptions: {
    expiresIn: '15m', // Default for access tokens
  },
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  } as CookieOptions,
  accessTokenConfig: {
    expiresIn: '15m',
  },
  refreshTokenConfig: {
    expiresIn: '7d',
  },
};
