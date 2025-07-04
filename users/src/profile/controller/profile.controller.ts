import { Controller } from '@nestjs/common';
import { ProfileService } from '../service/profile.service';

@Controller()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}
}
