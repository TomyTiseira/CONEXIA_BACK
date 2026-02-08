import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OnboardingJwtGuard extends AuthGuard('onboarding-jwt') {}
