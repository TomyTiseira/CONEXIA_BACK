export class UserPlanResponseDto {
  plan: {
    id: number;
    name: string;
    description: string | null;
    monthlyPrice: number;
    annualPrice: number;
    benefits: Array<{
      key: string;
      value: unknown;
      name: string;
    }>;
  };

  subscription?: {
    id: number;
    status: string;
    billingCycle: string;
    startDate: Date | null;
    endDate: Date | null;
    nextPaymentDate: Date | null;
    price: number; // Precio del plan al momento de contratar
  };

  paymentInfo?: {
    nextPaymentAmount: number; // Monto del próximo pago
    nextPaymentDate: Date | null; // Fecha del próximo pago
    paymentMethod: {
      type: string; // 'credit_card', 'debit_card', etc.
      lastFourDigits: string | null; // Últimos 4 dígitos
      brand: string | null; // 'visa', 'mastercard', etc.
    } | null;
  };

  memberSince: Date; // Fecha de alta del usuario

  isFreePlan: boolean;
}
