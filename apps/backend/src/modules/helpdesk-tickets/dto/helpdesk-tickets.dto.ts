import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  HelpdeskEntityTypeDto,
  HelpdeskTicketPriorityDto,
  HelpdeskTicketSourceDto,
  HelpdeskTicketStatusDto,
} from './helpdesk-tickets.enums';

export class CreateTicketCategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class TicketCategoryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

export class CreateTicketSubcategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class TicketSubcategoryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class CreateTicketDto {
  @IsOptional()
  @IsUUID()
  requesterUserId?: string;

  @IsOptional()
  @IsUUID()
  requesterEmployeeId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsEnum(HelpdeskTicketPriorityDto)
  priority?: HelpdeskTicketPriorityDto;

  @IsOptional()
  @IsEnum(HelpdeskTicketSourceDto)
  source?: HelpdeskTicketSourceDto;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsUUID()
  assignedEmployeeId?: string;

  @IsOptional()
  @IsString()
  assignedTeamName?: string;

  @IsOptional()
  @IsEnum(HelpdeskEntityTypeDto)
  entityType?: HelpdeskEntityTypeDto;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  firstResponseDueAt?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  resolutionDueAt?: string;
}

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsEnum(HelpdeskTicketPriorityDto)
  priority?: HelpdeskTicketPriorityDto;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  firstResponseDueAt?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  resolutionDueAt?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  firstResponseBreached?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  resolutionBreached?: boolean;
}

export class ChangeTicketStatusDto {
  @IsEnum(HelpdeskTicketStatusDto)
  status!: HelpdeskTicketStatusDto;
}

export class AssignTicketDto {
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsUUID()
  assignedEmployeeId?: string;

  @IsOptional()
  @IsString()
  assignedTeamName?: string;
}

export class TicketCommentDto {
  @IsString()
  @IsNotEmpty()
  commentText!: string;

  @IsOptional()
  @IsUUID()
  authorEmployeeId?: string;
}

export class TicketInternalNoteDto {
  @IsString()
  @IsNotEmpty()
  noteText!: string;

  @IsOptional()
  @IsUUID()
  authorEmployeeId?: string;
}

export class TicketAttachmentDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  storageKey!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsInt()
  @Min(0)
  size!: number;
}

export class TicketQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(HelpdeskTicketStatusDto)
  declare status?: HelpdeskTicketStatusDto;

  @IsOptional()
  @IsEnum(HelpdeskTicketPriorityDto)
  priority?: HelpdeskTicketPriorityDto;

  @IsOptional()
  @IsEnum(HelpdeskTicketSourceDto)
  source?: HelpdeskTicketSourceDto;

  @IsOptional()
  @IsUUID()
  requesterUserId?: string;

  @IsOptional()
  @IsUUID()
  requesterEmployeeId?: string;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsUUID()
  assignedEmployeeId?: string;

  @IsOptional()
  @IsString()
  assignedTeamName?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @IsOptional()
  @IsEnum(HelpdeskEntityTypeDto)
  entityType?: HelpdeskEntityTypeDto;

  @IsOptional()
  @IsUUID()
  entityId?: string;
}
