/**
 * Nombres de roles basados en el script de seed
 * Estos nombres deben coincidir con los definidos en users/src/users/constants/roles.ts
 */
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderador',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLES_IDS = {
  ADMIN: 1,
  USER: 2,
  MODERATOR: 3,
} as const;

export type RoleId = (typeof ROLES_IDS)[keyof typeof ROLES_IDS];

// Mapeo de nombres de roles a IDs para el guard
export const ROLE_NAME_TO_ID: Record<string, number> = {
  admin: 1,
  user: 2,
  moderador: 3,
} as const;
