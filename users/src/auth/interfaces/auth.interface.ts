export interface JwtPayload {
  sub: number; // user id
  email: string;
  roleId: number;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    roleId: number;
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
