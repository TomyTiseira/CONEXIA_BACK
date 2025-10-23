export interface MappedUserReview {
  id: number;
  reviewedUserId: number;
  reviewedUser: {
    id: number;
    email: string;
    profileId: number;
    name: string;
    lastName: string;
  };
  reviewerUserId: number;
  reviewerUser: {
    id: number;
    email: string;
    profileId: number;
    name: string;
    lastName: string;
    profession: string;
    profilePicture?: string;
  };
  relationship: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserReviewWithProfiles {
  id: number;
  reviewedUserId: number;
  reviewedUser: {
    id: number;
    email: string;
    profileId: number;
    profile?: {
      name: string;
      lastName: string;
    };
  };
  reviewerUserId: number;
  reviewerUser: {
    id: number;
    email: string;
    profileId: number;
    profile?: {
      name: string;
      lastName: string;
      profession: string;
      profilePicture?: string;
    };
  };
  relationship: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserReviewMapper {
  static mapToResponse(review: UserReviewWithProfiles): MappedUserReview {
    return {
      id: review.id,
      reviewedUserId: review.reviewedUserId,
      reviewedUser: {
        id: review.reviewedUser.id,
        email: review.reviewedUser.email,
        profileId: review.reviewedUser.profileId,
        name: review.reviewedUser.profile?.name || '',
        lastName: review.reviewedUser.profile?.lastName || '',
      },
      reviewerUserId: review.reviewerUserId,
      reviewerUser: {
        id: review.reviewerUser.id,
        email: review.reviewerUser.email,
        profileId: review.reviewerUser.profileId,
        name: review.reviewerUser.profile?.name || '',
        lastName: review.reviewerUser.profile?.lastName || '',
        profession: review.reviewerUser.profile?.profession || '',
        profilePicture:
          review.reviewerUser.profile?.profilePicture || undefined,
      },
      relationship: review.relationship,
      description: review.description,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  static mapToResponseArray(
    reviews: UserReviewWithProfiles[],
  ): MappedUserReview[] {
    return reviews.map((review) => this.mapToResponse(review));
  }
}
