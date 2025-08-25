export class ProjectResponseDto {
  id: number;
  title: string;
  image?: string;
  category: {
    id: number;
    name: string;
  };
  collaborationType: {
    id: number;
    name: string;
  };
  contractType: {
    id: number;
    name: string;
  };
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
  maxCollaborators: number;
  postulationStatus?: { code: string } | null;
}
