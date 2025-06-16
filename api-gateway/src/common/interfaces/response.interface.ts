export interface ResponseFormat<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  path?: string;
}
