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
}
