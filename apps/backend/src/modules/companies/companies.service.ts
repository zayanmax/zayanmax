import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCompanyDto) {
    return this.prisma.company.create({ data: dto });
  }

  findOne(id: string) {
    return this.prisma.company.findFirst({ where: { id, deletedAt: null } });
  }

  async update(id: string, dto: UpdateCompanyDto) {
    const result = await this.prisma.company.updateMany({
      where: { id, deletedAt: null },
      data: dto,
    });
    if (result.count === 0) throw new NotFoundException('Company not found');
    return this.findOne(id);
  }
}
