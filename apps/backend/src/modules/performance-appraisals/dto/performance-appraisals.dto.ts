import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  EmployeeGoalStatusDto,
  EmployeeReviewStatusDto,
  PerformanceCycleStatusDto,
} from './performance-appraisals.enums';

export class CreatePerformanceCycleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsISO8601({ strict: true })
  startDate!: string;

  @IsISO8601({ strict: true })
  endDate!: string;
}

export class PerformanceCycleQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(PerformanceCycleStatusDto)
  declare status?: PerformanceCycleStatusDto;
}

export class CreateGoalDto {
  @IsOptional()
  @IsUUID()
  cycleId?: string;

  @IsUUID()
  employeeId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  targetValue?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsISO8601({ strict: true })
  dueDate?: string;
}

export class GoalQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(EmployeeGoalStatusDto)
  declare status?: EmployeeGoalStatusDto;

  @IsOptional()
  @IsUUID()
  cycleId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

export class GoalProgressDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  progress!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class ChangeGoalStatusDto {
  @IsEnum(EmployeeGoalStatusDto)
  status!: EmployeeGoalStatusDto;
}

export class CreateKpiCategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateEmployeeKpiDto {
  @IsOptional()
  @IsUUID()
  cycleId?: string;

  @IsUUID()
  employeeId!: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  score?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReviewTemplateQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionText!: string;

  @IsOptional()
  @IsString()
  responseType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

export class CreateReviewTemplateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewTemplateQuestionDto)
  questions?: ReviewTemplateQuestionDto[];
}

export class ReviewTemplateQueryDto extends PaginationQueryDto {}

export class CreateEmployeeReviewDto {
  @IsOptional()
  @IsUUID()
  cycleId?: string;

  @IsUUID()
  employeeId!: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @IsUUID()
  reviewerUserId?: string;

  @IsOptional()
  @IsUUID()
  managerEmployeeId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overallScore?: number;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsBoolean()
  promotionRecommended?: boolean;

  @IsOptional()
  @IsString()
  promotionRecommendationText?: string;

  @IsOptional()
  @IsBoolean()
  incrementRecommended?: boolean;
}

export class ReviewQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(EmployeeReviewStatusDto)
  declare status?: EmployeeReviewStatusDto;

  @IsOptional()
  @IsUUID()
  cycleId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsUUID()
  managerEmployeeId?: string;
}

export class ChangeReviewStatusDto {
  @IsEnum(EmployeeReviewStatusDto)
  status!: EmployeeReviewStatusDto;
}

export class ReviewResponseDto {
  @IsOptional()
  @IsUUID()
  questionId?: string;

  @IsOptional()
  @IsString()
  responseText?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  score?: number;
}

export class FeedbackDto {
  @IsUUID()
  employeeId!: string;

  @IsOptional()
  @IsUUID()
  feedbackByEmployeeId?: string;

  @IsString()
  @IsNotEmpty()
  feedbackText!: string;

  @IsOptional()
  @IsString()
  feedbackType?: string;

  @IsOptional()
  @IsString()
  visibility?: string;
}

export class OneOnOneNoteDto {
  @IsUUID()
  employeeId!: string;

  @IsOptional()
  @IsUUID()
  managerEmployeeId?: string;

  @IsISO8601({ strict: true })
  meetingDate!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  actionItems?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  nextMeetingDate?: string;
}

export class PromotionRecommendationDto {
  @IsUUID()
  employeeId!: string;

  @IsOptional()
  @IsUUID()
  reviewId?: string;

  @IsOptional()
  @IsUUID()
  recommendedByEmployeeId?: string;

  @IsString()
  @IsNotEmpty()
  recommendationText!: string;

  @IsOptional()
  @IsString()
  currentDesignation?: string;

  @IsOptional()
  @IsString()
  recommendedDesignation?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  effectiveFrom?: string;
}
