export class ProjectResponseDto {
  id: number;
  title: string;
  image?: string;
  category: {
    id: number;
    name: string;
  };
  // collaborationType and contractType are now role-scoped and not present at project level
  owner: {
    id: number;
    name: string;
    image?: string;
  };
  isOwner: boolean;
  skills?: {
    id: number;
    name?: string;
  }[];
  endDate?: string;
  deletedAt?: string;
  isActive: boolean;
  suspendedByModeration: boolean; // Indica si el proyecto fue suspendido por moderación
  isApplied: boolean;
  approvedApplications: number;
  postulationStatus?: { code: string } | null;
  summary?: {
    contractTypes?: string[];
    collaborationTypes?: string[];
  };
}
