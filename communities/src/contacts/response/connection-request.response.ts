export class ConnectionRequestResponse {
  id: number;
  senderId: number;
  receiverId: number;
  status: string;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  senderName?: string;
  receiverName?: string;
}
