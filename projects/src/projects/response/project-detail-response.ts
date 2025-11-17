export interface ProjectDetailResponse {
  id: number;
  title: string;
  description: string;
  image?: string;
  location?: string;
  owner: string;
  ownerId: number;
  ownerImage?: string;
  roles?: Array<{
    id: number;
    title: string;
    description?: string;
    applicationTypes?: string[];
    contractType?: { id: number; name: string } | null;
    collaborationType?: { id: number; name: string } | null;
    maxCollaborators?: number | null;
    skills?: { id: number; name?: string }[];
    questions?: Array<{
      id: number;
      questionText: string;
      questionType: string;
      required: boolean;
      options: Array<{
        id: number;
        optionText: string;
        isCorrect: boolean;
      }>;
    }>;
    evaluation?: {
      id: number;
      description?: string;
      link?: string;
      fileUrl?: string;
      fileName?: string;
      days: number;
    } | null;
  }>;
  category: string[];
  isActive: boolean;
  deletedAt?: string;
  startDate?: Date;
  endDate?: Date;
  isOwner: boolean;
  approvedApplications: number; // Cantidad de postulaciones aprobadas para el proyecto
  hasReported: boolean; // Indica si el usuario actual ya reportó este proyecto
  userPostulationStatus: string | null; // Estado de la postulación del usuario actual (ACTIVE, ACCEPTED, REJECTED, etc.) o null si no ha aplicado
  userEvaluationDeadline: Date | null; // Fecha límite para completar la evaluación técnica (solo si está en PENDING_EVALUATION)
}
