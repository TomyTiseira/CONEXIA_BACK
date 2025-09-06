export class RecommendationResponse {
  id: number;
  name: string;
  image: string;
  profession: string;
  skillsMatch: number;
  mutualFriends: number;
  skills: {
    id: number;
    name: string;
  }[];
}
