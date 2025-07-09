import { Injectable } from '@nestjs/common';
import { GetProfileDto } from '../dto/get-profile.dto';
import { GetProfileUseCase } from './use-cases/get-profile.use-cases';

@Injectable()
export class ProfileService {
  constructor(private readonly getProfileUseCase: GetProfileUseCase) {}

  async getProfile(getProfileDto: GetProfileDto) {
    return this.getProfileUseCase.execute(getProfileDto);
  }
}
