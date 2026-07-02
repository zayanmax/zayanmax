import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export enum ClientActivityTypeDto {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  FOLLOW_UP = 'FOLLOW_UP',
  NOTE = 'NOTE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  DOCUMENT = 'DOCUMENT',
  OTHER = 'OTHER',
}

export class CreateClientActivityDto {
  @IsEnum(ClientActivityTypeDto)
  type!: ClientActivityTypeDto;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  @IsOptional()
  @IsISO8601()
  completedAt?: string;
}
