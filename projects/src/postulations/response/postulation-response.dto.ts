export class PostulationStatusResponseDto {
  id: number;
  name: string;
  code: string;
}

export class PostulationResponseDto {
  id: number;
  userId: number;
  projectId: number;
  status: PostulationStatusResponseDto;
  cvUrl: string;
}
