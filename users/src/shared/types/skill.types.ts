/**
 * Tipo para la respuesta de skills en un perfil
 */
export type ProfileSkillResponse = {
  id: number;
  name: string;
};

/**
 * Tipo para los datos de conexión
 */
export type ConnectionData = {
  id: number;
  state: string;
  senderId: number;
};

/**
 * Tipo para la respuesta completa de un perfil con skills
 */
export type ProfileWithSkills = {
  id: number;
  name: string;
  lastName: string;
  profession: string;
  phoneNumber?: string;
  country?: string;
  state?: string;
  birthDate?: Date;
  profilePicture?: string;
  coverPicture?: string;
  description?: string;
  experience?: any[];
  socialLinks?: any[];
  education?: any[];
  certifications?: any[];
  skills: ProfileSkillResponse[];
  verified?: boolean;
  connectionData?: ConnectionData | null;
  conversationId?: number | null;
};

/**
 * Tipo para la respuesta de validación de skills
 */
export type SkillsValidationResponse = {
  valid: boolean;
  invalidIds: number[];
  message?: string;
};
