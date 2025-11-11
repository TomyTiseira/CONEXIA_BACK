export interface UserServiceMetricsDto {
  totalServicesHired: number;
  totalRevenueGenerated: number;
}

export interface ServicesByTypeDto {
  type: string;
  count: number;
  revenue: number;
}

export interface AdminServiceMetricsDto {
  totalServicesHired: number;
  totalRevenue: number;
  byType: ServicesByTypeDto[];
}
