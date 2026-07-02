import {
  IsEmail,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EmploymentTypeDto {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
}

export class CreateEmployeeDto {
  @ApiProperty({ example: 'EMP-1001' })
  @IsString()
  @MinLength(2)
  employeeCode!: string;

  @ApiProperty({ example: 'Naveen' })
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({ example: 'Kumar' })
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiProperty({ example: 'naveen.kumar@zayan.test' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '9000000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  designationId?: string;

  @IsOptional()
  @IsUUID()
  reportingManagerId?: string;

  @ApiProperty({ example: '2035-01-15' })
  @IsISO8601()
  joiningDate!: string;

  @ApiPropertyOptional({
    enum: EmploymentTypeDto,
    example: EmploymentTypeDto.FULL_TIME,
  })
  @IsOptional()
  @IsEnum(EmploymentTypeDto)
  employmentType?: EmploymentTypeDto;
}
