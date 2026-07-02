import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ClientTypeDto {
  COMPANY = 'COMPANY',
  INDIVIDUAL = 'INDIVIDUAL',
}

export enum ClientStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PROSPECT = 'PROSPECT',
  ARCHIVED = 'ARCHIVED',
}

export class CreateClientDto {
  @ApiProperty({ enum: ClientTypeDto, example: ClientTypeDto.COMPANY })
  @IsEnum(ClientTypeDto)
  type!: ClientTypeDto;

  @ApiProperty({ example: 'Acme Technologies' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'billing@acme.test' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '9000000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://acme.test' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  companySize?: string;

  @ApiPropertyOptional({ example: '29ABCDE1234F1Z5' })
  @IsOptional()
  @IsString()
  taxNumber?: string;

  @ApiPropertyOptional({ example: '12 Market Road, Chennai' })
  @IsOptional()
  @IsString()
  billingAddress?: string;

  @ApiPropertyOptional({
    enum: ClientStatusDto,
    example: ClientStatusDto.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ClientStatusDto)
  status?: ClientStatusDto;

  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
