import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    companyId: string,
    actorId: string,
    dto: CreateEmployeeDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.employee.findFirst({
      where: {
        companyId,
        employeeCode: dto.employeeCode,
        deletedAt: null,
      },
    });
    if (existing) {
      throw new ConflictException('Employee code already exists');
    }

    const employee = await this.prisma.employee.create({
      data: {
        companyId,
        employeeCode: dto.employeeCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        branchId: dto.branchId,
        departmentId: dto.departmentId,
        designationId: dto.designationId,
        reportingManagerId: dto.reportingManagerId,
        joiningDate: new Date(dto.joiningDate),
        employmentType: dto.employmentType ?? 'FULL_TIME',
        createdById: actorId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        companyId,
        actorId,
        action: 'employees.create',
        entityType: 'Employee',
        entityId: employee.id,
        newValue: employee,
        ipAddress,
        userAgent,
      },
    });

    return employee;
  }

  async findAll(companyId: string, query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.search
        ? {
            OR: [
              {
                firstName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                lastName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                email: { contains: query.search, mode: 'insensitive' as const },
              },
              {
                employeeCode: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(companyId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async update(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdateEmployeeDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const oldValue = await this.findOne(companyId, id);
    const employee = await this.prisma.employee.update({
      where: { id },
      data: {
        ...dto,
        email: dto.email?.toLowerCase(),
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : undefined,
        updatedById: actorId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        companyId,
        actorId,
        action: 'employees.update',
        entityType: 'Employee',
        entityId: employee.id,
        oldValue,
        newValue: employee,
        ipAddress,
        userAgent,
      },
    });

    return employee;
  }

  async remove(
    companyId: string,
    id: string,
    actorId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const result = await this.prisma.employee.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), updatedById: actorId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Employee not found');
    }

    await this.prisma.auditLog.create({
      data: {
        companyId,
        actorId,
        action: 'employees.delete',
        entityType: 'Employee',
        entityId: id,
        ipAddress,
        userAgent,
      },
    });

    return { deleted: true };
  }
}
