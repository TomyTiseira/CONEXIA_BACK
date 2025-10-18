import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { ClaimStatus } from '../enums/claim.enum';

export class ResolveClaimDto {
  @IsEnum([ClaimStatus.RESOLVED, ClaimStatus.REJECTED], {
    message: 'El estado debe ser RESOLVED o REJECTED',
  })
  status: ClaimStatus.RESOLVED | ClaimStatus.REJECTED;

  @IsString()
  @MinLength(20, {
    message: 'La resolución debe tener al menos 20 caracteres',
  })
  @MaxLength(2000, {
    message: 'La resolución no puede exceder 2000 caracteres',
  })
  resolution: string;
}
