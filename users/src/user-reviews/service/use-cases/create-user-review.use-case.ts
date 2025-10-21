import { Injectable } from '@nestjs/common';
import {
  UserCannotReviewSelfException,
  UserNotFoundByIdException,
} from 'src/common/exceptions/user.exceptions';
import { UserReview } from 'src/shared/entities/user-review.entity';
import { UsersService } from 'src/users/service/users.service';
import { CreateUserReviewDto } from '../../dto/create-user-review.dto';
import { UserReviewRepository } from '../../repository/user-review.repository';

@Injectable()
export class CreateUserReviewUseCase {
  constructor(
    private readonly userReviewRepository: UserReviewRepository,
    private readonly usersService: UsersService,
  ) {}

  async execute(createUserReviewDto: CreateUserReviewDto): Promise<UserReview> {
    const { reviewedUserId, reviewerUserId } = createUserReviewDto;

    // Validar que el usuario no se reseñe a sí mismo
    if (reviewedUserId === reviewerUserId) {
      throw new UserCannotReviewSelfException();
    }

    // Validar que el usuario reseñado existe
    const reviewedUser = await this.usersService.findUserById(reviewedUserId);
    if (!reviewedUser) {
      throw new UserNotFoundByIdException(reviewedUserId);
    }

    // Validar que el usuario que reseña existe
    const reviewerUser = await this.usersService.findUserById(reviewerUserId);
    if (!reviewerUser) {
      throw new UserNotFoundByIdException(reviewerUserId);
    }

    return await this.userReviewRepository.create(createUserReviewDto);
  }
}
