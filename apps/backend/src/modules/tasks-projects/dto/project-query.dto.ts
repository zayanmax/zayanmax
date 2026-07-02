import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ProjectStatusDto } from './create-project.dto';

export class ProjectQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ProjectStatusDto,
    example: ProjectStatusDto.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProjectStatusDto)
  declare status?: ProjectStatusDto;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000001' })
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
