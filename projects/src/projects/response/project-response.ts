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
  skills: {
    id: number;
    name?: string;
  }[];
  endDate?: string;
  deletedAt?: string;
  isActive: boolean;
  isApplied: boolean;
  approvedApplications: number;
  // maxCollaborators is now role-scoped
  postulationStatus?: { code: string } | null;
}
