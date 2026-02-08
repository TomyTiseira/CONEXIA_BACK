export class ConnectionRequestResponse {
  id: number;
  senderId: number;
  receiverId: number;
  status: string;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  sender: {
    name: string;
    email: string;
    image: string;
    profession: string;
  };
  receiverName?: string;
}
