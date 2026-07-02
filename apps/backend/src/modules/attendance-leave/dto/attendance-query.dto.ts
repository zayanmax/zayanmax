import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AttendanceStatusDto } from './attendance-status.dto';

export class AttendanceQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @IsOptional()
  @IsEnum(AttendanceStatusDto)
  declare status?: AttendanceStatusDto;

  @IsOptional()
  @IsISO8601({ strict: true })
  fromDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  toDate?: string;
}

export class MonthlySummaryQueryDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

export class EmployeeReportQueryDto {
  @IsOptional()
  @IsISO8601({ strict: true })
  fromDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  toDate?: string;
}
