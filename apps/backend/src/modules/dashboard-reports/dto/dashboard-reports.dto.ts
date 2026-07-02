import {
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ReportExportFormat, ReportExportStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class DashboardDateRangeQueryDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class CreateReportExportRequestDto {
  @IsString()
  reportType!: string;

  @IsOptional()
  @IsObject()
  requestedFilters?: Record<string, unknown>;

  @IsEnum(ReportExportFormat)
  format!: ReportExportFormat;
}

export class ReportExportRequestQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  reportType?: string;

  @IsOptional()
  @IsEnum(ReportExportFormat)
  format?: ReportExportFormat;

  @IsOptional()
  @IsEnum(ReportExportStatus)
  declare status?: ReportExportStatus;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}
