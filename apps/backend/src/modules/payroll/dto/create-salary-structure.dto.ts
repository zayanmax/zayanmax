import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PayrollCalculationTypeDto,
  PayrollComponentTypeDto,
} from './payroll.enums';

export class SalaryStructureComponentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsEnum(PayrollComponentTypeDto)
  type!: PayrollComponentTypeDto;

  @IsOptional()
  @IsEnum(PayrollCalculationTypeDto)
  calculationType?: PayrollCalculationTypeDto;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsBoolean()
  taxable?: boolean;
}

export class CreateSalaryStructureDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateNested({ each: true })
  @Type(() => SalaryStructureComponentDto)
  components!: SalaryStructureComponentDto[];
}
