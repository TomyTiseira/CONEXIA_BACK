export class ContractPlanResponseDto {
  success: boolean;
  message: string;
  data: {
    subscriptionId: number;
    mercadoPagoUrl: string;
    mercadoPagoSubscriptionId: string;
    expiresAt: Date;
  };
}
