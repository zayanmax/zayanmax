import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
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
});
