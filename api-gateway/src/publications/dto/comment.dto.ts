export class CommentDto {
  id: number;
  content: string;
  userId: number;
  publicationId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
