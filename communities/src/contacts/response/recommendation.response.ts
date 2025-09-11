export class RecommendationResponse {
  id: number;
  name: string;
  image: string;
  profession: string;
  skillsMatch: number;
  mutualFriends: number;
  score?: number; // Campo opcional para puntuación
  skills: {
    id: number;
    name: string;
  }[];
}
