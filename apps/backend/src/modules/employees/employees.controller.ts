import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { RequestContextDecorator } from '../../common/decorators/request-context.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CurrentUser } from '../../common/types/current-user.type';
import type { RequestContext } from '../../common/types/request-context.type';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

@ApiTags('Employees')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @RequirePermissions('employees.view')
  @Get()
  findAll(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.employeesService.findAll(user.companyId, query);
  }

  @RequirePermissions('employees.create')
  @Post()
  create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateEmployeeDto,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.employeesService.create(
      user.companyId,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
    );
  }

  @RequirePermissions('employees.view')
  @Get(':id')
  findOne(@CurrentUserDecorator() user: CurrentUser, @Param('id') id: string) {
    return this.employeesService.findOne(user.companyId, id);
  }

  @RequirePermissions('employees.update')
  @Patch(':id')
  update(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.employeesService.update(
      user.companyId,
      id,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
    );
  }

  @RequirePermissions('employees.delete')
  @Delete(':id')
  remove(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.employeesService.remove(
      user.companyId,
      id,
      user.id,
      context.ipAddress,
      context.userAgent,
    );
  }
}
