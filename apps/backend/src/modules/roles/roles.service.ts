import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(companyId: string) {
    return this.prisma.role.findMany({
      where: { companyId },
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(companyId: string, dto: CreateRoleDto) {
    const permissions = dto.permissionKeys?.length
      ? await this.prisma.permission.findMany({
          where: { key: { in: dto.permissionKeys } },
        })
      : [];

    return this.prisma.role.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        isSystemRole: dto.isSystemRole ?? false,
        permissions: {
          create: permissions.map((permission) => ({
            permissionId: permission.id,
          })),
        },
      },
      include: { permissions: { include: { permission: true } } },
    });
  }
}
