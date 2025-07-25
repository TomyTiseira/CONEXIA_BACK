import { User } from '../../shared/entities/user.entity';
import { Profile } from '../entities/profile.entity';

export class CreateProfileResponseDto {
  success: boolean;
  message: string;
  profile: Profile;
  user: User;
}
