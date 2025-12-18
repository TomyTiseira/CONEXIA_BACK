export interface FriendResponse {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  profession: string;
  profilePicture?: string;
  coverPicture?: string | null;
  connectionId: number;
  status: string;
  conversationId: number | null;
  createdAt: Date;
  updatedAt: Date;
}
