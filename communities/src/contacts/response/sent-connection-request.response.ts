export class SentConnectionRequestResponse {
  id: number;
  senderId: number;
  receiverId: number;
  status: string;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  receiver: {
    name: string;
    email: string;
    image: string;
    profession: string;
  };
}
