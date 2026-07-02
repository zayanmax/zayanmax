import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  it('wraps successful responses in the standard API format', async () => {
    const interceptor = new ResponseInterceptor();
    const context = {} as never;
    const next = {
      handle: () => of({ id: 'company-id' }),
    };

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({
      success: true,
      message: 'Request completed successfully',
      data: { id: 'company-id' },
    });
  });

  it('preserves paginated metadata when handlers return data and meta', async () => {
    const interceptor = new ResponseInterceptor();
    const context = {} as never;
    const next = {
      handle: () =>
        of({
          data: [{ id: 'employee-id' }],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
    };

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({
      success: true,
      data: [{ id: 'employee-id' }],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  });
});
