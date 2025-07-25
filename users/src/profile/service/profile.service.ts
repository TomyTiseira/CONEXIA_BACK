import { Injectable } from '@nestjs/common';
import { CreateProfileResponseDto } from '../dto/create-profile-response.dto';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { GetProfileDto } from '../dto/get-profile.dto';
import { CreateProfileUseCase } from './use-cases/create-profile.use-cases';
import { GetProfileUseCase } from './use-cases/get-profile.use-cases';

@Injectable()
export class ProfileService {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly createUseCase: CreateProfileUseCase,
  ) {}

  async getProfile(getProfileDto: GetProfileDto) {
    return this.getProfileUseCase.execute(getProfileDto);
  }

  createProfile(dto: CreateProfileDto): Promise<CreateProfileResponseDto> {
    return this.createUseCase.execute(dto);
  }
}
