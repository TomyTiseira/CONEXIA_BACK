export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    roleId: number;
    profileId: number;
  };
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  roleId: number;
  profileId: number;
}
