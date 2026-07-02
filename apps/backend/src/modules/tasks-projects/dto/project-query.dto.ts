import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ProjectStatusDto } from './create-project.dto';

export class ProjectQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ProjectStatusDto)
  declare status?: ProjectStatusDto;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  memberUserId?: string;

  @IsOptional()
  @IsUUID()
  memberEmployeeId?: string;
}
