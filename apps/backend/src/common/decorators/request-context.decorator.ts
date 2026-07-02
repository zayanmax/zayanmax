import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { CurrentUser } from '../types/current-user.type';
import type { RequestContext } from '../types/request-context.type';

type RequestLike = {
  user?: CurrentUser;
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
};

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function firstForwardedIp(value: string | string[] | undefined) {
  const header = firstHeader(value);
  return header?.split(',')[0]?.trim();
}

export function getRequestContext(request: RequestLike): RequestContext {
  const headers = request.headers ?? {};
  return {
    actorUserId: request.user?.id,
    companyId: request.user?.companyId,
    ipAddress:
      firstForwardedIp(headers['x-forwarded-for']) ??
      request.ip ??
      request.socket?.remoteAddress,
    userAgent: firstHeader(headers['user-agent']),
    requestId:
      firstHeader(headers['x-request-id']) ??
      firstHeader(headers['x-correlation-id']),
  };
}

export const RequestContextDecorator = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext => {
    return getRequestContext(ctx.switchToHttp().getRequest<RequestLike>());
  },
);
