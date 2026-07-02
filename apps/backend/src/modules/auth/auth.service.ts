import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';

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

  async login(dto: LoginDto) {
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash,
        lastLoginAt: new Date(),
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
      user: this.toAuthUser(user, permissions),
    };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.userPermissionInclude(),
    });

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const permissions = this.getPermissionKeys(user);
    return this.issueTokens(user, permissions);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    return { loggedOut: true };
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
}
