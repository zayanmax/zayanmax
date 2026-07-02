import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CurrentUser } from '../../common/types/current-user.type';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @RequirePermissions('settings.view')
  @Get()
  findAll(@CurrentUserDecorator() user: CurrentUser) {
    return this.departmentsService.findAll(user.companyId);
  }

  @RequirePermissions('settings.manage')
  @Post()
  create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateDepartmentDto,
  ) {
    return this.departmentsService.create(user.companyId, dto);
  }

  @RequirePermissions('settings.manage')
  @Patch(':id')
  update(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(user.companyId, id, dto);
  }
}
