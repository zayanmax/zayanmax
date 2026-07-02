import {
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportExportFormat, ReportExportStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class DashboardDateRangeQueryDto {
  @ApiPropertyOptional({ example: '2035-01-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2035-12-31' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class CreateReportExportRequestDto {
  @ApiProperty({ example: 'hr_summary' })
  @IsString()
  reportType!: string;

  @ApiPropertyOptional({
    example: { fromDate: '2035-01-01', toDate: '2035-12-31' },
  })
  @IsOptional()
  @IsObject()
  requestedFilters?: Record<string, unknown>;

  @ApiProperty({ enum: ReportExportFormat, example: ReportExportFormat.CSV })
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
