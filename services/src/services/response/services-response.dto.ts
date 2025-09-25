import { PaginationInfo } from '../../common/utils/pagination.utils';
import { TransformedService } from '../../common/utils/service-transform.utils';

export interface GetServicesResponseDto {
  services: TransformedService[];
  pagination: PaginationInfo;
}

export interface GetServicesByUserResponseDto {
  services: TransformedService[];
  pagination: PaginationInfo;
}

export interface GetServiceByIdResponseDto extends TransformedService {}
