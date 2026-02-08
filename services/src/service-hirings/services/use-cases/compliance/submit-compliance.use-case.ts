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
import { ComplianceSubmissionRepository } from '../../../repositories/compliance-submission.repository';

/**
 * Use case para que un usuario envíe evidencias de cumplimiento
 */
@Injectable()
export class SubmitComplianceUseCase {
  constructor(
    private readonly complianceRepository: ClaimComplianceRepository,
    private readonly submissionRepository: ComplianceSubmissionRepository,
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

    // VALIDAR QUE PUEDE SUBIR EVIDENCIA (permitir hasta 5 días vencido)
    if (!compliance.canStillSubmit()) {
      throw new BadRequestException(
        'El plazo para subir evidencia ha expirado (máximo 5 días después del vencimiento)',
      );
    }

    // 4. Validar archivos si se requieren
    // Cuando viene de submit-compliance-by-claim, evidenceUrls ya contiene las rutas
    // Cuando viene directo con files, files tiene los objetos de Multer
    const hasEvidence =
      (dto.evidenceUrls && dto.evidenceUrls.length > 0) ||
      (files && files.length > 0);

    if (compliance.requiresFiles && !hasEvidence) {
      throw new BadRequestException(
        'Este cumplimiento requiere archivos adjuntos',
      );
    }

    // 5. Guardar URLs de evidencias
    let evidenceUrls: string[] = [];

    // Si ya vienen evidenceUrls procesadas (desde API Gateway), usarlas
    if (dto.evidenceUrls && dto.evidenceUrls.length > 0) {
      evidenceUrls = dto.evidenceUrls;
    }
    // Si vienen archivos sin procesar, generar rutas (modo directo)
    else if (files && files.length > 0) {
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

    // 7. Crear registro en la tabla de submissions para historial
    await this.submissionRepository.createSubmission({
      complianceId: compliance.id,
      attemptNumber: compliance.currentAttempt,
      evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : [],
      userNotes: dto.userNotes || null,
      submittedAt: new Date(),
    });

    await this.complianceRepository.save(compliance);

    console.log(
      `[SubmitCompliance] Compliance ${compliance.id} enviado por usuario ${dto.userId} (Intento ${compliance.currentAttempt}/${compliance.maxAttempts})`,
    );

    // Enviar emails de notificación
    try {
      const claim = compliance.claim;
      const hiringTitle = claim.hiring?.service?.title || 'Servicio sin título';

      // Obtener datos del usuario que envió la evidencia
      const responsibleUser =
        await this.usersClientService.getUserByIdWithRelations(
          Number(dto.userId),
        );
      const responsibleFirstName =
        responsibleUser?.profile?.firstName ||
        responsibleUser?.profile?.name ||
        'Usuario';
      const responsibleLastName = responsibleUser?.profile?.lastName || '';
      const responsibleUserName =
        `${responsibleFirstName} ${responsibleLastName}`.trim();

      // Email a la otra parte (cliente o proveedor, según quien NO sea el responsable)
      // userId en ServiceHiring es el cliente
      // service.userId es el proveedor
      const clientUserId = claim.hiring.userId;
      const providerUserId = claim.hiring.service?.userId;

      const otherPartyUserId =
        compliance.responsibleUserId === clientUserId.toString()
          ? providerUserId
          : clientUserId;

      const otherPartyUser =
        await this.usersClientService.getUserByIdWithRelations(
          otherPartyUserId,
        );

      if (otherPartyUser) {
        const otherPartyFirstName =
          otherPartyUser.profile?.firstName ||
          otherPartyUser.profile?.name ||
          'Usuario';
        const otherPartyLastName = otherPartyUser.profile?.lastName || '';
        const otherPartyName =
          `${otherPartyFirstName} ${otherPartyLastName}`.trim();

        await this.emailService.sendComplianceEvidenceUploadedEmail(
          otherPartyUser.email,
          otherPartyName,
          responsibleUserName,
          false, // No es el usuario responsable
          {
            complianceId: compliance.id,
            complianceType: compliance.complianceType,
            claimId: compliance.claimId,
            hiringTitle,
            userNotes: compliance.userNotes,
            attemptNumber: compliance.currentAttempt,
          },
        );
      }

      // Email al usuario que envió la evidencia (confirmación)
      if (responsibleUser) {
        await this.emailService.sendComplianceEvidenceUploadedEmail(
          responsibleUser.email,
          responsibleUserName,
          responsibleUserName,
          true, // Es el usuario responsable
          {
            complianceId: compliance.id,
            complianceType: compliance.complianceType,
            claimId: compliance.claimId,
            hiringTitle,
            userNotes: compliance.userNotes,
            attemptNumber: compliance.currentAttempt,
          },
        );
      }

      // Email al moderador asignado
      const moderatorId = claim.assignedModeratorId;
      if (moderatorId) {
        const moderator =
          await this.usersClientService.getUserByIdWithRelations(moderatorId);

        if (moderator) {
          await this.emailService.sendComplianceSubmittedEmail(
            moderator.email,
            responsibleUserName,
            {
              complianceId: compliance.id,
              complianceType: compliance.complianceType,
              claimId: compliance.claimId,
              hiringTitle,
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
