import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import {
  ChangePasswordDto,
  PasswordResetConfirmDto,
  PasswordResetRequestDto,
} from './dto/password.dto';

type UserWithPermissions = {
  id: string;
  companyId: string;
  employeeId: string | null;
  email: string;
  passwordHash: string;
  refreshTokenHash?: string | null;
  status: string;
  roles: {
    role: {
      permissions: {
        permission: {
          key: string;
        };
      }[];
    };
  }[];
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(
    dto: LoginDto,
    metadata?: { ipAddress?: string; userAgent?: string; deviceName?: string },
  ) {
    const user = await this.findUserWithPermissions(dto.email);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const permissions = this.getPermissionKeys(user);
    const tokens = await this.issueTokens(user, permissions);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    const refreshExpiresAt = this.expiryDate('JWT_REFRESH_EXPIRES_IN');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash,
        lastLoginAt: new Date(),
      },
    });
    const session = await this.prisma.userSession.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        refreshTokenHash,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        deviceName: metadata?.deviceName,
        lastUsedAt: new Date(),
        expiresAt: refreshExpiresAt,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        actorId: user.id,
        action: 'auth.login',
        entityType: 'User',
        entityId: user.id,
      },
    });

    return {
      ...tokens,
      sessionId: session.id,
      user: this.toAuthUser(user, permissions),
    };
  }

  async refresh(userId: string, refreshToken: string, sessionId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.userPermissionInclude(),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.findMatchingSession(
      userId,
      refreshToken,
      sessionId,
    );
    const legacyMatches = user.refreshTokenHash
      ? await bcrypt.compare(refreshToken, user.refreshTokenHash)
      : false;

    if (!session && !legacyMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const permissions = this.getPermissionKeys(user);
    const tokens = await this.issueTokens(user, permissions);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });
    if (session) {
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: {
          refreshTokenHash,
          lastUsedAt: new Date(),
          expiresAt: this.expiryDate('JWT_REFRESH_EXPIRES_IN'),
        },
      });
    }

    return { ...tokens, sessionId: session?.id };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { loggedOut: true };
  }

  async logoutAll(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { loggedOutAllSessions: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.userPermissionInclude(),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }

    return this.toAuthUser(user, this.getPermissionKeys(user));
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Invalid session');

    const currentMatches = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!currentMatches) {
      throw new UnauthorizedException('Current password is invalid');
    }
    const samePassword = await bcrypt.compare(
      dto.newPassword,
      user.passwordHash,
    );
    if (samePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await bcrypt.hash(dto.newPassword, 10),
        refreshTokenHash: null,
      },
    });
    await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        actorId: user.id,
        action: 'auth.password.change',
        entityType: 'User',
        entityId: user.id,
      },
    });

    return { passwordChanged: true };
  }

  async requestPasswordReset(
    dto: PasswordResetRequestDto,
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      return { resetRequested: true, delivery: 'metadata_only' };
    }

    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const token = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        tokenHash: await bcrypt.hash(token, 10),
        requestedIpAddress: metadata?.ipAddress,
        requestedUserAgent: metadata?.userAgent,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        actorId: user.id,
        action: 'auth.password_reset.request',
        entityType: 'User',
        entityId: user.id,
      },
    });

    return { resetRequested: true, delivery: 'metadata_only' };
  }

  async confirmPasswordReset(dto: PasswordResetConfirmDto) {
    const tokens = await this.prisma.passwordResetToken.findMany({
      where: {
        userId: dto.userId,
        ...(dto.resetTokenId ? { id: dto.resetTokenId } : {}),
        usedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
      take: 5,
    });
    for (const resetToken of tokens) {
      const matches = await bcrypt.compare(dto.token, resetToken.tokenHash);
      if (!matches) continue;
      await this.prisma.user.update({
        where: { id: dto.userId },
        data: {
          passwordHash: await bcrypt.hash(dto.newPassword, 10),
          refreshTokenHash: null,
        },
      });
      await this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });
      await this.prisma.userSession.updateMany({
        where: { userId: dto.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return { passwordReset: true };
    }
    throw new UnauthorizedException('Invalid or expired password reset token');
  }

  private async findUserWithPermissions(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: this.userPermissionInclude(),
    });
  }

  private userPermissionInclude() {
    return {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    };
  }

  private getPermissionKeys(user: UserWithPermissions) {
    return Array.from(
      new Set(
        user.roles.flatMap((userRole) =>
          userRole.role.permissions.map(
            (rolePermission) => rolePermission.permission.key,
          ),
        ),
      ),
    ).sort();
  }

  private async issueTokens(user: UserWithPermissions, permissions: string[]) {
    const payload = {
      sub: user.id,
      companyId: user.companyId,
      employeeId: user.employeeId,
      email: user.email,
      permissions,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.tokenExpiry('JWT_ACCESS_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.tokenExpiry('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private toAuthUser(user: UserWithPermissions, permissions: string[]) {
    return {
      id: user.id,
      companyId: user.companyId,
      employeeId: user.employeeId,
      email: user.email,
      permissions,
    };
  }

  private tokenExpiry(key: string): NonNullable<JwtSignOptions['expiresIn']> {
    return this.configService.getOrThrow<string>(key) as NonNullable<
      JwtSignOptions['expiresIn']
    >;
  }

  private expiryDate(key: string) {
    const value = this.configService.getOrThrow<string>(key);
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + amount * multipliers[unit]);
  }

  private async findMatchingSession(
    userId: string,
    refreshToken: string,
    sessionId?: string,
  ) {
    const sessions = sessionId
      ? await this.prisma.userSession.findMany({
          where: {
            id: sessionId,
            userId,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          take: 1,
        })
      : await this.prisma.userSession.findMany({
          where: {
            userId,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          orderBy: { lastUsedAt: 'desc' },
          take: 10,
        });

    for (const session of sessions) {
      if (await bcrypt.compare(refreshToken, session.refreshTokenHash)) {
        return session;
      }
    }
    return null;
  }
}
