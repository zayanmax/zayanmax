import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CurrentUser } from '../../common/types/current-user.type';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @RequirePermissions('settings.manage')
  @Post()
  create(@Body() dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }

  @RequirePermissions('settings.view')
  @Get('current')
  current(@CurrentUserDecorator() user: CurrentUser) {
    return this.companiesService.findOne(user.companyId);
  }

  @RequirePermissions('settings.manage')
  @Patch('current')
  updateCurrent(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(user.companyId, dto);
  }
}
