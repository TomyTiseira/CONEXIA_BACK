export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderador',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];
