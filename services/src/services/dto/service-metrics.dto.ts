export class ServiceMetricsDto {
  userId: number;
  userPlan: 'Free' | 'Basic' | 'Premium';
}

export class ServiceMetricsResponseDto {
  // Métricas disponibles para FREE
  totalServicesHired: number; // Cantidad total de servicios propios contratados
  totalServicesPublished: number; // Total de servicios publicados por el usuario
  hiringPercentage: number; // Porcentaje de servicios que fueron contratados
  averageRating: number; // Calificación promedio (1-5)
  totalReviews: number; // Total de reseñas recibidas

  // Métricas adicionales para BASIC
  totalRevenueGenerated?: number; // Ingresos totales (ARS) - solo BASIC y PREMIUM
  serviceRevenueBreakdown?: Array<{
    // Desglose de ingresos por servicio
    serviceId: number;
    serviceTitle: string;
    totalRevenue: number;
    timesCompleted: number;
  }>; // Ingresos generados por cada servicio - solo BASIC y PREMIUM

  // Métricas adicionales para PREMIUM
  servicesCompleted?: number; // Servicios completados exitosamente
  servicesCancelled?: number; // Servicios cancelados
  servicesWithClaims?: number; // Servicios que tuvieron reclamos
  topHiredServices?: Array<{
    serviceId: number;
    serviceTitle: string;
    timesHired: number;
    revenue: number;
    averageRating: number;
  }>; // Top 5 servicios más contratados

  // Metadata
  userPlan: 'Free' | 'Basic' | 'Premium';
  lastUpdated: Date;
}

export class ExportServiceMetricsDto {
  userId: number;
  userPlan: 'Free' | 'Basic' | 'Premium';
  format?: 'csv' | 'json';
}

// DTOs antiguos para mantener compatibilidad con otros endpoints
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
