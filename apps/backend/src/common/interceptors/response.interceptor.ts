import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'data' in value &&
    'meta' in value &&
    Array.isArray((value as PaginatedResponse<T>).data),
  );
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (isPaginatedResponse(data)) {
          return {
            success: true,
            data: data.data,
            meta: data.meta,
          };
        }

        return {
          success: true,
          message: 'Request completed successfully',
          data,
        };
      }),
    );
  }
}
