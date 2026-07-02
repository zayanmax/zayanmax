import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { TaskPriorityDto, TaskStatusDto } from './create-task.dto';

export class TaskQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000001' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  parentTaskId?: string;

  @ApiPropertyOptional({ enum: TaskStatusDto, example: TaskStatusDto.TODO })
  @IsOptional()
  @IsEnum(TaskStatusDto)
  declare status?: TaskStatusDto;

  @ApiPropertyOptional({ enum: TaskPriorityDto, example: TaskPriorityDto.HIGH })
  @IsOptional()
  @IsEnum(TaskPriorityDto)
  priority?: TaskPriorityDto;

  @IsOptional()
  @IsUUID()
  assigneeUserId?: string;

  @IsOptional()
  @IsUUID()
  assigneeEmployeeId?: string;
}
