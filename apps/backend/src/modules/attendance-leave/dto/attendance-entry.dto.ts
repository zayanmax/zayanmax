import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AttendanceStatusDto } from './attendance-status.dto';

export class CheckInDto {
  @IsUUID()
  employeeId!: string;

  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  date?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  checkInAt?: string;

  @IsOptional()
  @IsEnum(AttendanceStatusDto)
  status?: AttendanceStatusDto;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CheckOutDto {
  @IsUUID()
  employeeId!: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  date?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  checkOutAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ManualAttendanceDto {
  @IsUUID()
  employeeId!: string;

  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @IsISO8601({ strict: true })
  date!: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  checkInAt?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  checkOutAt?: string;

  @IsEnum(AttendanceStatusDto)
  status!: AttendanceStatusDto;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
