import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryAttachment } from '../../service-hirings/entities/delivery-attachment.entity';
import { DeliverySubmission } from '../../service-hirings/entities/delivery-submission.entity';

@Injectable()
export class DeliveryAttachmentMigrationService implements OnModuleInit {
  constructor(
    @InjectRepository(DeliverySubmission)
    private readonly deliveryRepository: Repository<DeliverySubmission>,
    @InjectRepository(DeliveryAttachment)
    private readonly attachmentRepository: Repository<DeliveryAttachment>,
  ) {}

  async onModuleInit() {
    console.log('🔄 Verificando migración de delivery attachments...');
    await this.migrateExistingDeliveries();
  }

  private async migrateExistingDeliveries() {
    try {
      // Buscar deliveries que tienen attachmentPath pero no tienen registros en delivery_attachments
      const deliveriesWithFiles = await this.deliveryRepository
        .createQueryBuilder('delivery')
        .leftJoinAndSelect('delivery.attachments', 'attachment')
        .where('delivery.attachmentPath IS NOT NULL')
        .andWhere("delivery.attachmentPath != ''")
        .getMany();

      const deliveriesToMigrate = deliveriesWithFiles.filter(
        (delivery) =>
          !delivery.attachments || delivery.attachments.length === 0,
      );

      if (deliveriesToMigrate.length === 0) {
        console.log('✅ No hay deliveries para migrar');
        return;
      }

      console.log(
        `📦 Migrando ${deliveriesToMigrate.length} deliveries con archivos adjuntos...`,
      );

      const attachmentsToCreate = deliveriesToMigrate.map((delivery) => ({
        deliveryId: delivery.id,
        filePath: delivery.attachmentPath,
        fileUrl: delivery.attachmentPath,
        fileName: this.extractFileName(delivery.attachmentPath),
        fileSize: delivery.attachmentSize || undefined,
        mimeType: this.getMimeType(delivery.attachmentPath) || undefined,
        orderIndex: 0,
      }));

      await this.attachmentRepository.save(attachmentsToCreate);

      console.log(
        `✅ Migración completada: ${attachmentsToCreate.length} archivos migrados`,
      );
    } catch (error) {
      console.error('❌ Error en migración de delivery attachments:', error);
      // No lanzamos el error para no interrumpir el inicio de la aplicación
    }
  }

  private extractFileName(filePath: string): string {
    if (!filePath) return 'archivo';
    const parts = filePath.split('/');
    return parts[parts.length - 1] || 'archivo';
  }

  private getMimeType(filePath: string): string | null {
    if (!filePath) return null;

    const extension = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
      txt: 'text/plain',
      mp4: 'video/mp4',
      avi: 'video/x-msvideo',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
    };

    return extension ? mimeTypes[extension] || null : null;
  }
}
