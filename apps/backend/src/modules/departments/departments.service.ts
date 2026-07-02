import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(companyId: string, dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: { ...dto, companyId } });
  }

  findAll(companyId: string) {
    return this.prisma.department.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async update(companyId: string, id: string, dto: UpdateDepartmentDto) {
    const result = await this.prisma.department.updateMany({
      where: { id, companyId, deletedAt: null },
      data: dto,
    });
    if (result.count === 0) throw new NotFoundException('Department not found');
    return this.prisma.department.findFirst({ where: { id, companyId } });
  }
}
