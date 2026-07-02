import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  create(companyId: string, dto: CreateBranchDto) {
    return this.prisma.branch.create({ data: { ...dto, companyId } });
  }

  findAll(companyId: string) {
    return this.prisma.branch.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async update(companyId: string, id: string, dto: UpdateBranchDto) {
    const result = await this.prisma.branch.updateMany({
      where: { id, companyId, deletedAt: null },
      data: dto,
    });
    if (result.count === 0) throw new NotFoundException('Branch not found');
    return this.prisma.branch.findFirst({ where: { id, companyId } });
  }
}
