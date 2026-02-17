import { Inject, Injectable } from '@nestjs/common';
import { FileStorage } from '../../../common/domain/interfaces/file-storage.interface';
import { ServiceLimitExceededException } from '../../../common/exceptions/services.exceptions';
import { MembershipsClientService } from '../../../common/services/memberships-client.service';
import { UsersClientService } from '../../../common/services/users-client.service';
import { CreateServiceDto } from '../../dto/create-service.dto';
import { Service } from '../../entities/service.entity';
import { ServiceRepository } from '../../repositories/service.repository';

@Injectable()
export class CreateServiceUseCase {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly usersClientService: UsersClientService,
    private readonly membershipsClientService: MembershipsClientService,
    @Inject('FILE_STORAGE')
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(
    createServiceDto: CreateServiceDto,
    userId: number,
  ): Promise<Service> {
    // Validar que el usuario esté verificado
    await this.usersClientService.validateUserIsVerified(userId);

    // Validar límite de servicios según el plan de suscripción
    const [activeServices] = await this.serviceRepository.findByUserId(
      userId,
      false,
      1,
      9999,
    );
    const activeServicesCount = activeServices.length;

    const { canPublish, limit, current } =
      await this.membershipsClientService.canPublishService(
        userId,
        activeServicesCount,
      );

    if (!canPublish) {
      throw new ServiceLimitExceededException(limit, current);
    }

    // Process images: base64 → upload → URLs
    let imageUrls: string[] = [];

    if (createServiceDto.imageFiles && createServiceDto.imageFiles.length > 0) {
      // New base64 approach
      imageUrls = await Promise.all(
        createServiceDto.imageFiles.map(async (imageFile, index) => {
          const buffer = Buffer.from(imageFile.fileData, 'base64');
          const timestamp = Date.now();
          const extension = this.getExtensionFromMimeType(imageFile.mimeType);
          const filename = `service-${userId}-${timestamp}-${index}.${extension}`;

          const url = await this.fileStorage.upload(
            buffer,
            filename,
            imageFile.mimeType,
          );

          return url;
        }),
      );
    } else if (createServiceDto.images && createServiceDto.images.length > 0) {
      // Legacy URL approach
      imageUrls = createServiceDto.images;
    }

    const serviceData = {
      ...createServiceDto,
      userId,
      images: imageUrls,
      status: createServiceDto.status || 'active',
    };

    // Remove temporary fields that shouldn't be in DB
    delete (serviceData as any).imageFiles;

    return await this.serviceRepository.create(serviceData);
  }

  /**
   * Helper para obtener extensión de archivo desde MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };

    return mimeMap[mimeType] || 'jpg';
  }
}
