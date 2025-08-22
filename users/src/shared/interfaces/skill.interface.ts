/**
 * Interfaz que representa una habilidad (skill) en el microservicio de usuarios
 * Esta interfaz se usa para tipar las respuestas del microservicio de proyectos
 */
export interface Skill {
  id: number;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/**
 * Interfaz para la respuesta de validación de skills
 */
export interface SkillsValidationResult {
  valid: boolean;
  invalidIds: number[];
}

/**
 * Interfaz para la respuesta de búsqueda de skills por IDs
 */
export interface SkillsByIdsResponse {
  skills: Skill[];
  foundCount: number;
  requestedCount: number;
}

/**
 * Interfaz para la respuesta de búsqueda de una skill por ID
 */
export interface SkillByIdResponse {
  skill: Skill | null;
  found: boolean;
}
