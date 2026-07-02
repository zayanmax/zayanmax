import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';

@Injectable()
export class DesignationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(companyId: string, dto: CreateDesignationDto) {
    return this.prisma.designation.create({ data: { ...dto, companyId } });
  }

  findAll(companyId: string) {
    return this.prisma.designation.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async update(companyId: string, id: string, dto: UpdateDesignationDto) {
    const result = await this.prisma.designation.updateMany({
      where: { id, companyId, deletedAt: null },
      data: dto,
    });
    if (result.count === 0)
      throw new NotFoundException('Designation not found');
    return this.prisma.designation.findFirst({ where: { id, companyId } });
  }
}
