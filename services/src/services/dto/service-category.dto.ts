export class ServiceCategoryDto {
  id: number;
  name: string;
  description?: string;
}

export class ServiceCategoryResponseDto {
  categories: ServiceCategoryDto[];
}
