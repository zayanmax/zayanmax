import { getRequestContext } from './request-context.decorator';
import type { CurrentUser } from '../types/current-user.type';

describe('getRequestContext', () => {
  it('extracts actor, company, IP, user agent, and request ID from an HTTP request', () => {
    const user: CurrentUser = {
      id: 'user-id',
      companyId: 'company-id',
      email: 'admin@zayan.test',
      permissions: ['employees.view'],
    };
    const request = {
      user,
      ip: '10.0.0.10',
      headers: {
        'user-agent': 'frontend-test-agent',
        'x-request-id': 'request-id-123',
      },
    };

    expect(getRequestContext(request)).toEqual({
      actorUserId: 'user-id',
      companyId: 'company-id',
      ipAddress: '10.0.0.10',
      userAgent: 'frontend-test-agent',
      requestId: 'request-id-123',
    });
  });

  it('falls back to forwarded headers and keeps missing auth metadata optional', () => {
    const request = {
      headers: {
        'x-forwarded-for': '192.168.1.10, 192.168.1.11',
        'user-agent': ['first-agent', 'second-agent'],
        'x-correlation-id': ['correlation-id-1'],
      },
    };

    expect(getRequestContext(request)).toEqual({
      actorUserId: undefined,
      companyId: undefined,
      ipAddress: '192.168.1.10',
      userAgent: 'first-agent',
      requestId: 'correlation-id-1',
    });
  });
});
