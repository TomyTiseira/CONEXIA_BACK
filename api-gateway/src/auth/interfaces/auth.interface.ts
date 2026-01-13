export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
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
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    expiresIn: number;
  };
}

export interface VerifyCodeResetResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
  };
}
