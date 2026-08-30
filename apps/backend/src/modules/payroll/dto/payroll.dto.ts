import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  PayrollRunStatusDto,
  SalaryAdvanceStatusDto,
  SalaryAssignmentStatusDto,
} from './payroll.enums';

export class AssignSalaryDto {
  @IsUUID()
  employeeId!: string;

  @IsUUID()
  salaryStructureId!: string;

  @IsISO8601({ strict: true })
  effectiveFrom!: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  effectiveTo?: string;

  @IsNumber()
  @Min(0)
  monthlyGross!: number;
}

export class SalaryAssignmentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsUUID()
  salaryStructureId?: string;

  @IsOptional()
  @IsEnum(SalaryAssignmentStatusDto)
  declare status?: SalaryAssignmentStatusDto;
}

export class CreateSalaryAdvanceDto {
  @IsUUID()
  employeeId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsNumber()
  @Min(0.01)
  installmentAmount!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SalaryAdvanceQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsEnum(SalaryAdvanceStatusDto)
  declare status?: SalaryAdvanceStatusDto;
}

export class CreatePayrollPeriodDto {
  @IsString()
  name!: string;

  @IsISO8601({ strict: true })
  startDate!: string;

  @IsISO8601({ strict: true })
  endDate!: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  payDate?: string;
}

export class PayrollPeriodQueryDto extends PaginationQueryDto {}

export class CreatePayrollRunDto {
  @IsUUID()
  payrollPeriodId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePayrollRunDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ChangePayrollRunStatusDto {
  @IsEnum(PayrollRunStatusDto)
  status!: PayrollRunStatusDto;
}

export class PayrollRunQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  payrollPeriodId?: string;

  @IsOptional()
  @IsEnum(PayrollRunStatusDto)
  declare status?: PayrollRunStatusDto;
}

export class PayslipQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  payrollRunId?: string;
}
