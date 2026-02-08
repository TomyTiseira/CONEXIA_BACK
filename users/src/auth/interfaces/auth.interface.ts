export interface JwtPayload {
  sub: number; // user id
  email: string;
  roleId: number;
  profileId: number;
  isProfileComplete: boolean | null;
  type: 'access' | 'refresh' | 'onboarding';
  lastActivityAt?: string; // ISO string de la última actividad
  iat?: number;
  exp?: number;
}

export interface OnboardingTokenResponse {
  onboardingToken: string;
  expiresIn: number;
}

export interface LoginUserData {
  id: number;
  email: string;
  roleId: number;
  profileId: number;
  isProfileComplete: boolean | null;
}

export type LoginResponse =
  | {
      user: LoginUserData;
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      next?: undefined;
      onboardingToken?: undefined;
    }
  | {
      user: LoginUserData;
      onboardingToken: string;
      expiresIn: number;
      next: 'PROFILE_REQUIRED';
      accessToken?: undefined;
      refreshToken?: undefined;
    };

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
