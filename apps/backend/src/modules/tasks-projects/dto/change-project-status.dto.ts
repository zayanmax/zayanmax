import { IsEnum, IsISO8601, IsOptional } from 'class-validator';
import { ProjectStatusDto } from './create-project.dto';

export class ChangeProjectStatusDto {
  @IsEnum(ProjectStatusDto)
  status!: ProjectStatusDto;

  @IsOptional()
  @IsISO8601()
  completedAt?: string;
}
