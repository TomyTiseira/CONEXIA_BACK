import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyIdentityDto {
  @IsNotEmpty({ message: 'User ID is required' })
  userId: number;

  @IsNotEmpty({ message: 'Document image is required' })
  documentImage: {
    // New base64 approach (for API Gateway)
    fileData?: string; // base64 encoded image
    originalName?: string;
    mimeType?: string;

    // Legacy path approach (for backwards compatibility)
    path?: string;
    filename?: string;
    mimetype?: string;
  };

  @IsNotEmpty({ message: 'Face image is required' })
  faceImage: {
    // New base64 approach (for API Gateway)
    fileData?: string; // base64 encoded image
    originalName?: string;
    mimeType?: string;

    // Legacy path approach (for backwards compatibility)
    path?: string;
    filename?: string;
    mimetype?: string;
  };

  @IsOptional()
  @IsString()
  documentType?: string;
}

export class VerifyIdentityResponseDto {
  verified: boolean;
  similarity_score: number;
  document_number_extracted: string;
  document_number_match: boolean;
  message: string;
  verification_id?: number;
}
