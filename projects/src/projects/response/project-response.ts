export class ProjectResponseDto {
  id: number;
  title: string;
  image?: string;
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
