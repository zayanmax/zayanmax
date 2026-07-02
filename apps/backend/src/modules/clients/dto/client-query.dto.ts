import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ClientStatusDto, ClientTypeDto } from './create-client.dto';

export class ClientQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ClientStatusDto,
    example: ClientStatusDto.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ClientStatusDto)
  declare status?: ClientStatusDto;

  @ApiPropertyOptional({ enum: ClientTypeDto, example: ClientTypeDto.COMPANY })
  @IsOptional()
  @IsEnum(ClientTypeDto)
  type?: ClientTypeDto;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000001' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
