import { IsEnum, IsISO8601, IsOptional } from 'class-validator';
import { TaskStatusDto } from './create-task.dto';

export class ChangeTaskStatusDto {
  @IsEnum(TaskStatusDto)
  status!: TaskStatusDto;

  @IsOptional()
  @IsISO8601()
  completedAt?: string;
}
