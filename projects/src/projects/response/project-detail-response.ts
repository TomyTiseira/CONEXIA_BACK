export interface ProjectDetailResponse {
  id: number;
  title: string;
  description: string;
  image?: string;
  location?: string;
  owner: string;
  ownerId: number;
  ownerImage?: string;
  contractType: string[];
  collaborationType: string[];
  skills: string[];
  category: string[];
  maxCollaborators?: number;
  isActive: boolean;
  deletedAt?: string;
  startDate?: Date;
  endDate?: Date;
  isOwner: boolean;
  isApplied: boolean; // Indica si el usuario actual está postulado al proyecto
  approvedApplications: number; // Cantidad de postulaciones aprobadas para el proyecto
  hasReported: boolean; // Indica si el usuario actual ya reportó este proyecto
}
