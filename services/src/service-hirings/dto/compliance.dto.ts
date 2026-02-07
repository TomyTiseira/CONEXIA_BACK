import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ComplianceRequirement,
  ComplianceType,
} from '../enums/compliance.enum';

/**
 * DTO para crear un compliance (uso interno del sistema)
 */
export class CreateComplianceDto {
  @IsUUID()
  @IsNotEmpty()
  claimId: string;

  @IsString()
  @IsNotEmpty()
  responsibleUserId: string;

  @IsEnum(ComplianceType)
  @IsNotEmpty()
  complianceType: ComplianceType;

  @IsString()
  @IsNotEmpty()
  moderatorInstructions: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  deadlineDays?: number; // Default: 7

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsBoolean()
  @IsOptional()
  requiresFiles?: boolean; // Default: true

  @IsUUID()
  @IsOptional()
  dependsOn?: string; // ID del compliance previo

  @IsNumber()
  @IsOptional()
  orderNumber?: number;

  @IsEnum(ComplianceRequirement)
  @IsOptional()
  requirement?: ComplianceRequirement; // Default: SEQUENTIAL
}

/**
 * DTO para que el usuario responsable suba evidencia de cumplimiento
 */
export class SubmitComplianceDto {
  @IsUUID()
  @IsNotEmpty()
  complianceId: string;

  @IsString()
  @IsNotEmpty()
  userId: string; // Para verificar que es el responsable

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  userNotes?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  evidenceUrls?: string[]; // URLs de archivos ya subidos
}

/**
 * DTO para que la otra parte (peer) revise la evidencia
 */
export class PeerReviewComplianceDto {
  @IsUUID()
  @IsNotEmpty()
  complianceId: string;

  @IsString()
  @IsNotEmpty()
  userId: string; // Para verificar que es la otra parte

  @IsBoolean()
  @IsNotEmpty()
  approved: boolean; // true = aprueba, false = objeta

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  objection?: string; // Requerido si approved = false
}

/**
 * DTO para que el moderador revise y tome decisión
 */
export class ModeratorReviewComplianceDto {
  @IsUUID()
  @IsNotEmpty()
  complianceId: string;

  @IsString()
  @IsNotEmpty()
  moderatorId: string;

  @IsEnum(['approve', 'reject', 'adjust'])
  @IsNotEmpty()
  decision: 'approve' | 'reject' | 'adjust';

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  moderatorNotes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  rejectionReason?: string; // Requerido si decision = 'reject'

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  adjustmentInstructions?: string; // Requerido si decision = 'adjust'
}

/**
 * DTO para obtener compliances con filtros
 */
export class GetCompliancesDto {
  @IsUUID()
  @IsOptional()
  claimId?: string;

  @IsString()
  @IsOptional()
  responsibleUserId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  onlyOverdue?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;
}

/**
 * Response DTO para compliance
 */
export class ComplianceResponseDto {
  id: string;
  claimId: string;
  responsibleUserId: string;
  complianceType: ComplianceType;
  status: string;
  deadline: Date;
  extendedDeadline?: Date | null;
  finalDeadline?: Date | null;
  moderatorInstructions: string;
  evidenceUrls?: string[] | null;
  userNotes?: string | null;
  submittedAt?: Date | null;

  // Peer validation
  peerReviewedBy?: string | null;
  peerApproved?: boolean | null;
  peerObjection?: string | null;
  peerReviewedAt?: Date | null;

  // Moderator review
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  moderatorNotes?: string | null;
  rejectionReason?: string | null;
  rejectionCount: number;

  // Consecuencias
  warningLevel: number;
  appealed: boolean;

  // Dependencias
  dependsOn?: string | null;
  orderNumber: number;
  requirement: string;

  // Montos
  amount?: number | null;
  currency?: string | null;
  paymentLink?: string | null;

  // Flags
  autoApproved: boolean;
  requiresFiles: boolean;
  isOverdue: boolean;

  // Auditoría
  createdAt: Date;
  updatedAt: Date;
}
