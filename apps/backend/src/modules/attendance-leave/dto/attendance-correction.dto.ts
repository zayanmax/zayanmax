import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AttendanceStatusDto } from './attendance-status.dto';

export enum AttendanceCorrectionStatusDto {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class CreateAttendanceCorrectionDto {
  @IsOptional()
  @IsUUID()
  attendanceRecordId?: string;

  @IsUUID()
  employeeId!: string;

  @IsISO8601({ strict: true })
  date!: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  requestedCheckInAt?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  requestedCheckOutAt?: string;

  @IsOptional()
  @IsEnum(AttendanceStatusDto)
  requestedStatus?: AttendanceStatusDto;

  @IsString()
  reason!: string;
}

export class ReviewAttendanceCorrectionDto {
  @IsEnum(AttendanceCorrectionStatusDto)
  status!:
    | AttendanceCorrectionStatusDto.APPROVED
    | AttendanceCorrectionStatusDto.REJECTED;

  @IsOptional()
  @IsString()
  reviewComment?: string;
}

export class AttendanceCorrectionQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsEnum(AttendanceCorrectionStatusDto)
  declare status?: AttendanceCorrectionStatusDto;

  @IsOptional()
  @IsISO8601({ strict: true })
  fromDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  toDate?: string;
}
