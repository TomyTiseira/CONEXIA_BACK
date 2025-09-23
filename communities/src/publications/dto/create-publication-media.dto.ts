export interface MediaFileDto {
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  displayOrder: number;
}

export interface CreatePublicationMediaDto {
  publicationId: number;
  files: MediaFileDto[];
}
