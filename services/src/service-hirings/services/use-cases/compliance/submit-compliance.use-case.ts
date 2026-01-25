import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmailService } from '../../../../common/services/email.service';
import { UsersClientService } from '../../../../common/services/users-client.service';
import { SubmitComplianceDto } from '../../../dto/compliance.dto';
import { ClaimCompliance } from '../../../entities/claim-compliance.entity';
import { ComplianceStatus } from '../../../enums/compliance.enum';
import { ClaimComplianceRepository } from '../../../repositories/claim-compliance.repository';
import { ClaimRepository } from '../../../repositories/claim.repository';

/**
 * Use case para que un usuario envíe evidencias de cumplimiento
 */
@Injectable()
export class SubmitComplianceUseCase {
  constructor(
    private readonly complianceRepository: ClaimComplianceRepository,
    private readonly claimRepository: ClaimRepository,
    private readonly emailService: EmailService,
    private readonly usersClientService: UsersClientService,
  ) {}

  async execute(
    dto: SubmitComplianceDto,
    files?: any[],
  ): Promise<ClaimCompliance> {
    // Buscar el compliance
    const compliance = await this.complianceRepository.findOne({
      where: { id: dto.complianceId },
      relations: ['claim', 'claim.hiring', 'claim.hiring.service'],
    });
    if (!compliance) {
      throw new NotFoundException(
        `Compliance con ID ${dto.complianceId} no encontrado`,
      );
    }

    // 2. Validar que el usuario sea el responsable
    if (compliance.responsibleUserId !== dto.userId) {
      throw new ForbiddenException(
        'No tienes permiso para enviar este cumplimiento',
      );
    }

    // 3. Validar que no esté vencido o finalizado
    if (compliance.status === ComplianceStatus.APPROVED) {
      throw new BadRequestException('Este cumplimiento ya fue aprobado');
    }

    if (compliance.status === ComplianceStatus.REJECTED) {
      throw new BadRequestException(
        'Este cumplimiento fue rechazado. Debes apelar primero',
      );
    }

    // 4. Validar archivos si se requieren
    if (compliance.requiresFiles && (!files || files.length === 0)) {
      throw new BadRequestException(
        'Este cumplimiento requiere archivos adjuntos',
      );
    }

    // 5. Guardar URLs de evidencias (si hay archivos)
    let evidenceUrls: string[] = [];
    if (files && files.length > 0) {
      // TODO: Implementar subida de archivos a storage
      evidenceUrls = files.map(
        (file, index) =>
          `/uploads/compliances/${compliance.id}/${Date.now()}_${index}_${file.originalname}`,
      );
    }

    // 6. Actualizar compliance
    compliance.status = ComplianceStatus.SUBMITTED;
    compliance.submittedAt = new Date();
    compliance.evidenceUrls = evidenceUrls.length > 0 ? evidenceUrls : null;
    compliance.userNotes = dto.userNotes || null;

    await this.complianceRepository.save(compliance);

    console.log(
      `[SubmitComplianceUseCase] Compliance ${compliance.id} enviado por usuario ${dto.userId}`,
    );

    // Enviar email al moderador asignado
    try {
      const claim = compliance.claim;
      const moderatorId = claim.assignedModeratorId;

      if (moderatorId) {
        const moderator =
          await this.usersClientService.getUserByIdWithRelations(moderatorId);
        const responsibleUser =
          await this.usersClientService.getUserByIdWithRelations(
            Number(dto.userId),
          );

        if (moderator && responsibleUser) {
          const responsibleUserName =
            responsibleUser.profile?.firstName ||
            responsibleUser.profile?.name ||
            'Usuario';

          await this.emailService.sendComplianceSubmittedEmail(
            moderator.email,
            responsibleUserName,
            {
              complianceId: compliance.id,
              complianceType: compliance.complianceType,
              claimId: compliance.claimId,
              hiringTitle:
                claim.hiring?.service?.title || 'Servicio sin título',
              userNotes: compliance.userNotes,
              evidenceUrls: compliance.evidenceUrls,
            },
          );
        }
      }
    } catch (emailError) {
      console.error(
        '[SubmitComplianceUseCase] Error enviando email:',
        emailError,
      );
      // No lanzar error, solo loguear
    }

    return compliance;
  }
}
