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
  };

  isFreePlan: boolean;
}
