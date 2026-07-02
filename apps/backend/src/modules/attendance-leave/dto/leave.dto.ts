import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { LeaveRequestStatusDto } from './leave-request-status.dto';

export class CreateLeaveTypeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  annualAllowance?: number;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @IsOptional()
  @IsBoolean()
  paid?: boolean;
}

export class UpsertLeaveBalanceDto {
  @IsUUID()
  employeeId!: string;

  @IsUUID()
  leaveTypeId!: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  openingBalance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  accrued?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  used?: number;
}

export class CreateLeaveRequestDto {
  @IsUUID()
  employeeId!: string;

  @IsUUID()
  leaveTypeId!: string;

  @IsISO8601({ strict: true })
  fromDate!: string;

  @IsISO8601({ strict: true })
  toDate!: string;

  @IsNumber()
  @Min(0.5)
  days!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class ReviewLeaveRequestDto {
  @IsEnum(LeaveRequestStatusDto)
  status!: LeaveRequestStatusDto.APPROVED | LeaveRequestStatusDto.REJECTED;

  @IsOptional()
  @IsString()
  reviewComment?: string;
}

export class LeaveRequestQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsUUID()
  leaveTypeId?: string;

  @IsOptional()
  @IsEnum(LeaveRequestStatusDto)
  declare status?: LeaveRequestStatusDto;

  @IsOptional()
  @IsISO8601({ strict: true })
  fromDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  toDate?: string;
}
