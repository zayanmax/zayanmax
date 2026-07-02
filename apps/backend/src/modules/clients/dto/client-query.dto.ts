import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ClientStatusDto, ClientTypeDto } from './create-client.dto';

export class ClientQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ClientStatusDto)
  declare status?: ClientStatusDto;

  @IsOptional()
  @IsEnum(ClientTypeDto)
  type?: ClientTypeDto;

  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
