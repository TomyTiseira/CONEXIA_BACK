export interface JwtPayload {
  sub: number; // user id
  email: string;
  roleId: number;
  profileId: number;
  isProfileComplete: boolean | null;
  type: 'access' | 'refresh';
  lastActivityAt?: string; // ISO string de la última actividad
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    roleId: number;
    profileId: number;
    isProfileComplete: boolean | null;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface UserWithoutSensitiveData {
  id: number;
  email: string;
  roleId: number;
}

export interface PasswordResetTokenPayload {
  sub: number;
  email: string;
  type: 'access';
  iat?: number;
  exp?: number;
}
