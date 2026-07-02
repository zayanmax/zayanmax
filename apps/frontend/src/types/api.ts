export type ApiMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

export type StandardApiResponse<T> = {
  success: true;
  message?: string;
  data: T;
  meta?: ApiMeta;
};

export type StandardApiError = {
  success: false;
  message: string;
  errorCode: string;
  details?: unknown;
};

export type DateRangeQuery = {
  fromDate?: string;
  toDate?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  meta: Required<ApiMeta>;
};
