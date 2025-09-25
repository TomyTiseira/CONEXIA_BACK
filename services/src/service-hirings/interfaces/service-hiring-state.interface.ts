export interface ServiceHiringStateInterface {
  canQuote(): boolean;
  canAccept(): boolean;
  canReject(): boolean;
  canCancel(): boolean;
  canNegotiate(): boolean;
  canEdit(): boolean;
  getAvailableActions(): string[];
}
