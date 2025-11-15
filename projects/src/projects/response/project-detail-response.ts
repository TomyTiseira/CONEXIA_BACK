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
  }>;
  category: string[];
  isActive: boolean;
  deletedAt?: string;
  startDate?: Date;
  endDate?: Date;
  isOwner: boolean;
  isApplied: boolean; // Indica si el usuario actual está postulado al proyecto
  approvedApplications: number; // Cantidad de postulaciones aprobadas para el proyecto
  hasReported: boolean; // Indica si el usuario actual ya reportó este proyecto
}
