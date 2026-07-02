import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ClientTypeDto } from '../../clients/dto/create-client.dto';
import {
  LeadStatusDto,
  OpportunityStatusDto,
  QuotationStatusDto,
} from './sales-leads-quotations.enums';

export class CreateLeadSourceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateLeadStageDto extends CreateLeadSourceDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class LeadTaxonomyQueryDto extends PaginationQueryDto {}

export class CreateLeadDto {
  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @IsOptional()
  @IsUUID()
  stageId?: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValue?: number;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsUUID()
  assignedEmployeeId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLeadDto {
  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @IsOptional()
  @IsUUID()
  stageId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValue?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class LeadQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(LeadStatusDto)
  declare status?: LeadStatusDto;

  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @IsOptional()
  @IsUUID()
  stageId?: string;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsUUID()
  assignedEmployeeId?: string;
}

export class ChangeLeadStatusDto {
  @IsEnum(LeadStatusDto)
  status!: LeadStatusDto;

  @IsOptional()
  @IsString()
  lostReason?: string;
}

export class AssignLeadDto {
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsUUID()
  assignedEmployeeId?: string;
}

export class CreateLeadActivityDto {
  @IsString()
  @IsNotEmpty()
  activityType!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  activityAt?: string;
}

export class CreateLeadNoteDto {
  @IsString()
  @IsNotEmpty()
  note!: string;
}

export class ConvertLeadDto {
  @IsOptional()
  @IsEnum(ClientTypeDto)
  clientType?: ClientTypeDto;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  companySize?: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsOptional()
  @IsString()
  billingAddress?: string;
}

export class CreateOpportunityStageDto extends CreateLeadStageDto {}

export class OpportunityQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(OpportunityStatusDto)
  declare status?: OpportunityStatusDto;

  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  stageId?: string;
}

export class CreateOpportunityDto {
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  stageId?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedValue?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;

  @IsOptional()
  @IsISO8601({ strict: true })
  expectedCloseDate?: string;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsUUID()
  assignedEmployeeId?: string;
}

export class UpdateOpportunityDto {
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedValue?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;

  @IsOptional()
  @IsISO8601({ strict: true })
  expectedCloseDate?: string;
}

export class ChangeOpportunityStatusDto {
  @IsEnum(OpportunityStatusDto)
  status!: OpportunityStatusDto;

  @IsOptional()
  @IsString()
  lostReason?: string;
}

export class QuotationItemDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateQuotationDto {
  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsString()
  @IsNotEmpty()
  quotationNumber!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  validUntil?: string;

  @IsOptional()
  @IsString()
  terms?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items!: QuotationItemDto[];
}

export class UpdateQuotationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  validUntil?: string;

  @IsOptional()
  @IsString()
  terms?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class QuotationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(QuotationStatusDto)
  declare status?: QuotationStatusDto;

  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;
}

export class ChangeQuotationStatusDto {
  @IsEnum(QuotationStatusDto)
  status!: QuotationStatusDto;
}

export class AddQuotationVersionDto {
  @IsInt()
  @Min(1)
  versionNumber!: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  notes?: string;
}
