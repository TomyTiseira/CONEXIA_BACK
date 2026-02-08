import { Controller, Get } from '@nestjs/common';
import { LocalityRepository } from '../repository/locality.repository';

@Controller('localities')
export class LocalitiesController {
  constructor(private readonly localityRepository: LocalityRepository) {}

  @Get()
  async getLocalities() {
    try {
      const localities = await this.localityRepository.findAll();
      return {
        success: true,
        data: localities,
        message: 'localities fetched successfully',
      };
    } catch {
      return {
        success: false,
        message: 'Error fetching localities',
        error: 'error fetching localities',
      };
    }
  }
}
