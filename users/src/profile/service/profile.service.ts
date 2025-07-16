import { Injectable } from '@nestjs/common';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { GetProfileDto } from '../dto/get-profile.dto';
import { GetProfileUseCase } from './use-cases/get-profile.use-cases';
import { CreateProfileUseCase } from './use-cases/create-profile.use-cases';

@Injectable()
export class ProfileService {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly createUseCase: CreateProfileUseCase,
  ) {}

  async getProfile(getProfileDto: GetProfileDto) {
    return this.getProfileUseCase.execute(getProfileDto);
  }

  createProfile(dto: CreateProfileDto) {
    return this.createUseCase.execute(dto);
  }
}
