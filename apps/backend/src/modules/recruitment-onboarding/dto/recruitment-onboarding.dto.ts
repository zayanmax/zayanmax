import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
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
import { EmploymentTypeDto } from '../../employees/dto/create-employee.dto';
import {
  ApplicationStatusDto,
  JobOpeningStatusDto,
  OfferStatusDto,
} from './recruitment-onboarding.enums';

export class CreateJobOpeningDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

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
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(EmploymentTypeDto)
  employmentType?: EmploymentTypeDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  openingsCount?: number;
}

export class JobOpeningQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(JobOpeningStatusDto)
  declare status?: JobOpeningStatusDto;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  designationId?: string;
}

export class ChangeJobOpeningStatusDto {
  @IsEnum(JobOpeningStatusDto)
  status!: JobOpeningStatusDto;
}

export class CreateCandidateDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  sourceDetails?: string;

  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @IsOptional()
  @IsString()
  currentTitle?: string;

  @IsOptional()
  @IsString()
  currentCompany?: string;

  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CandidateQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  source?: string;
}

export class CreatePipelineStageDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class PipelineStageQueryDto extends PaginationQueryDto {}

export class CreateApplicationDto {
  @IsUUID()
  candidateId!: string;

  @IsUUID()
  jobOpeningId!: string;

  @IsOptional()
  @IsUUID()
  stageId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApplicationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ApplicationStatusDto)
  declare status?: ApplicationStatusDto;

  @IsOptional()
  @IsUUID()
  candidateId?: string;

  @IsOptional()
  @IsUUID()
  jobOpeningId?: string;

  @IsOptional()
  @IsUUID()
  stageId?: string;
}

export class ChangeApplicationStatusDto {
  @IsEnum(ApplicationStatusDto)
  status!: ApplicationStatusDto;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  withdrawnReason?: string;
}

export class CreateInterviewRoundDto {
  @IsUUID()
  applicationId!: string;

  @IsString()
  @IsNotEmpty()
  roundName!: string;

  @IsOptional()
  @IsString()
  interviewType?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  scheduledAt?: string;

  @IsOptional()
  @IsUUID()
  interviewerUserId?: string;

  @IsOptional()
  @IsUUID()
  interviewerEmployeeId?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class InterviewFeedbackDto {
  @IsOptional()
  @IsUUID()
  feedbackByEmployeeId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsString()
  recommendation?: string;
}

export class CreateOfferLetterDto {
  @IsUUID()
  applicationId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  offeredDesignation?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offeredSalary?: number;

  @IsOptional()
  @IsISO8601({ strict: true })
  joiningDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  expiryDate?: string;

  @IsOptional()
  @IsString()
  documentName?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ChangeOfferStatusDto {
  @IsEnum(OfferStatusDto)
  status!: OfferStatusDto;
}

export class OnboardingChecklistItemDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsISO8601({ strict: true })
  dueDate?: string;
}

export class CreateOnboardingChecklistDto {
  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @IsOptional()
  @IsUUID()
  candidateId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OnboardingChecklistItemDto)
  items?: OnboardingChecklistItemDto[];
}

export class CompleteOnboardingItemDto {
  @IsOptional()
  @IsUUID()
  completedById?: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

export class ConvertCandidateToEmployeeDto {
  @IsString()
  @MinLength(2)
  employeeCode!: string;

  @IsISO8601({ strict: true })
  joiningDate!: string;

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

  @IsOptional()
  @IsEnum(EmploymentTypeDto)
  employmentType?: EmploymentTypeDto;
}
