import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GetProfileDto } from '../dto/get-profile.dto';
import { ProfileService } from '../service/profile.service';

@Controller()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @MessagePattern('getProfile')
  getProfile(@Payload() getProfileDto: GetProfileDto) {
    return this.profileService.getProfile(getProfileDto);
  }
}
