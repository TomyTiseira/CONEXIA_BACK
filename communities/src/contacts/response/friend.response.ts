export interface FriendResponse {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  profession: string;
  profilePicture?: string;
  connectionId: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
