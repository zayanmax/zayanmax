import * as bcrypt from 'bcrypt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const jwtService = {
    signAsync: jest.fn(
      async (_payload: unknown, options?: { secret?: string }) =>
        options?.secret === 'refresh-secret' ? 'refresh-token' : 'access-token',
    ),
  };

  const configService = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        JWT_ACCESS_SECRET: 'access-secret',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '30d',
      };
      return values[key];
    }),
  };

  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userSession: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns tokens and stores a hashed refresh token for valid credentials', async () => {
    const passwordHash = await bcrypt.hash('Password123', 1);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      companyId: 'company-id',
      email: 'admin@zayan.test',
      passwordHash,
      status: 'ACTIVE',
      employeeId: 'employee-id',
      roles: [
        {
          role: {
            permissions: [{ permission: { key: 'employees.view' } }],
          },
        },
      ],
    });
    prisma.user.update.mockResolvedValue({});
    prisma.userSession.create.mockResolvedValue({ id: 'session-id' });

    const service = new AuthService(
      prisma as never,
      jwtService as never,
      configService as never,
    );

    const result = await service.login({
      email: 'admin@zayan.test',
      password: 'Password123',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.sessionId).toBe('session-id');
    expect(result.user.permissions).toEqual(['employees.view']);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-id' },
        data: expect.objectContaining({
          refreshTokenHash: expect.any(String),
          lastLoginAt: expect.any(Date),
        }),
      }),
    );
    expect(prisma.userSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-id',
          companyId: 'company-id',
          refreshTokenHash: expect.any(String),
        }),
      }),
    );
  });

  it('rejects invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const service = new AuthService(
      prisma as never,
      jwtService as never,
      configService as never,
    );

    await expect(
      service.login({ email: 'missing@zayan.test', password: 'Password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('changes password after validating the current password and revokes other sessions', async () => {
    const passwordHash = await bcrypt.hash('Password123', 1);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      companyId: 'company-id',
      email: 'admin@zayan.test',
      passwordHash,
    });
    prisma.user.update.mockResolvedValue({});
    prisma.userSession.updateMany.mockResolvedValue({ count: 2 });
    const service = new AuthService(
      prisma as never,
      jwtService as never,
      configService as never,
    );

    const result = await service.changePassword('user-id', {
      currentPassword: 'Password123',
      newPassword: 'Password456',
    });

    expect(result).toEqual({ passwordChanged: true });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-id' },
        data: expect.objectContaining({
          passwordHash: expect.any(String),
          refreshTokenHash: null,
        }),
      }),
    );
    expect(prisma.userSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-id', revokedAt: null }),
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
  });

  it('rejects password change when the new password matches the current password', async () => {
    const passwordHash = await bcrypt.hash('Password123', 1);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      companyId: 'company-id',
      email: 'admin@zayan.test',
      passwordHash,
    });
    const service = new AuthService(
      prisma as never,
      jwtService as never,
      configService as never,
    );

    await expect(
      service.changePassword('user-id', {
        currentPassword: 'Password123',
        newPassword: 'Password123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates password reset metadata without sending email', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      companyId: 'company-id',
      email: 'admin@zayan.test',
    });
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
    prisma.passwordResetToken.create.mockResolvedValue({ id: 'reset-id' });
    const service = new AuthService(
      prisma as never,
      jwtService as never,
      configService as never,
    );

    const result = await service.requestPasswordReset({
      email: 'admin@zayan.test',
    });

    expect(result).toEqual({
      resetRequested: true,
      delivery: 'metadata_only',
    });
    expect(prisma.passwordResetToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-id',
          companyId: 'company-id',
          tokenHash: expect.any(String),
        }),
      }),
    );
  });
});
