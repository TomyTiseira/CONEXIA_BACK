import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserReview } from 'src/shared/entities/user-review.entity';
import { Repository } from 'typeorm';
import { CreateUserReviewDto } from '../dto/create-user-review.dto';
import { GetUserReviewsDto } from '../dto/get-user-reviews.dto';
import { UpdateUserReviewDto } from '../dto/update-user-review.dto';

@Injectable()
export class UserReviewRepository {
  constructor(
    @InjectRepository(UserReview)
    private readonly userReviewRepository: Repository<UserReview>,
  ) {}

  async create(createUserReviewDto: CreateUserReviewDto): Promise<UserReview> {
    const userReview = this.userReviewRepository.create(createUserReviewDto);
    return await this.userReviewRepository.save(userReview);
  }

  async findByReviewedUserId(
    getUserReviewsDto: GetUserReviewsDto,
  ): Promise<[any[], number]> {
    const { userId, page = 1, limit = 10 } = getUserReviewsDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userReviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.reviewedUser', 'reviewedUser')
      .leftJoinAndSelect('review.reviewerUser', 'reviewerUser')
      .leftJoinAndSelect('reviewedUser.profile', 'reviewedUserProfile')
      .leftJoinAndSelect('reviewerUser.profile', 'reviewerUserProfile')
      .where('review.reviewedUserId = :userId', { userId })
      .orderBy('review.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    return await queryBuilder.getManyAndCount();
  }

  async findByReviewerAndReviewed(
    reviewerUserId: number,
    reviewedUserId: number,
  ): Promise<UserReview | null> {
    return await this.userReviewRepository.findOne({
      where: {
        reviewerUserId,
        reviewedUserId,
      },
    });
  }

  async findById(id: number): Promise<UserReview | null> {
    return await this.userReviewRepository.findOne({
      where: { id },
    });
  }

  async update(
    id: number,
    updateUserReviewDto: UpdateUserReviewDto,
  ): Promise<UserReview | null> {
    await this.userReviewRepository.update(id, updateUserReviewDto);
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.userReviewRepository.delete(id);
  }
}
