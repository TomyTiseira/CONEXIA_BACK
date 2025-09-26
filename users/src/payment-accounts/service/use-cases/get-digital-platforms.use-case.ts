import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DigitalPlatform } from '../../../shared/entities/digital-platform.entity';
import { DigitalPlatformResponseDto } from '../../dto/digital-platform-response.dto';

@Injectable()
export class GetDigitalPlatformsUseCase {
  constructor(
    @InjectRepository(DigitalPlatform)
    private readonly digitalPlatformRepository: Repository<DigitalPlatform>,
  ) {}

  async execute(): Promise<DigitalPlatformResponseDto[]> {
    const platforms = await this.digitalPlatformRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    return platforms.map((platform) => ({
      id: platform.id,
      name: platform.name,
      code: platform.code,
      isActive: platform.isActive,
    }));
  }
}
