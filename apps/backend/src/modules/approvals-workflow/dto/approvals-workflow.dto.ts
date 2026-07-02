import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  ApprovalEntityTypeDto,
  ApprovalRequestStatusDto,
  ApprovalStepApproverTypeDto,
} from './approvals-workflow.enums';

export class ApprovalWorkflowStepDto {
  @IsInt()
  @Min(1)
  stepOrder!: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(ApprovalStepApproverTypeDto)
  approverType!: ApprovalStepApproverTypeDto;

  @IsOptional()
  @IsUUID()
  approverUserId?: string;

  @IsOptional()
  @IsUUID()
  approverEmployeeId?: string;

  @IsOptional()
  @IsUUID()
  approverRoleId?: string;

  @IsOptional()
  @IsUUID()
  approverDepartmentId?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  delegationAllowed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  escalationAfterHours?: number;

  @IsOptional()
  @IsObject()
  escalationMetadata?: Record<string, unknown>;
}

export class CreateApprovalWorkflowDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  module?: string;

  @IsEnum(ApprovalEntityTypeDto)
  entityType!: ApprovalEntityTypeDto;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovalWorkflowStepDto)
  steps!: ApprovalWorkflowStepDto[];
}

export class UpdateApprovalWorkflowDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class ApprovalWorkflowQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ApprovalEntityTypeDto)
  entityType?: ApprovalEntityTypeDto;
}

export class SubmitApprovalRequestDto {
  @IsUUID()
  workflowDefinitionId!: string;

  @IsEnum(ApprovalEntityTypeDto)
  entityType!: ApprovalEntityTypeDto;

  @IsString()
  @IsNotEmpty()
  entityId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  requestedByEmployeeId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  escalationMetadata?: Record<string, unknown>;
}

export class ApprovalRequestQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ApprovalRequestStatusDto)
  declare status?: ApprovalRequestStatusDto;

  @IsOptional()
  @IsEnum(ApprovalEntityTypeDto)
  entityType?: ApprovalEntityTypeDto;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsUUID()
  workflowDefinitionId?: string;
}

export class ApprovalDecisionDto {
  @IsUUID()
  stepInstanceId!: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ApprovalCommentDto {
  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class DelegateApprovalDto extends ApprovalDecisionDto {
  @IsOptional()
  @IsUUID()
  delegatedToUserId?: string;

  @IsOptional()
  @IsUUID()
  delegatedToEmployeeId?: string;
}
