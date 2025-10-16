export class PaymentModalityResponseDto {
  id: number;
  name: string;
  code: string;
  description: string;
  initialPaymentPercentage: number;
  finalPaymentPercentage: number;
  isActive: boolean;
}
