import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CurrentUser } from '../../common/types/current-user.type';
import { CreateRoleDto } from './dto/create-role.dto';
import { RolesService } from './roles.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @RequirePermissions('roles.view')
  @Get()
  findAll(@CurrentUserDecorator() user: CurrentUser) {
    return this.rolesService.findAll(user.companyId);
  }

  @RequirePermissions('roles.manage')
  @Post()
  create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rolesService.create(user.companyId, dto);
  }
}
