import { IsEnum } from 'class-validator';
import { ClientStatusDto } from './create-client.dto';

export class ChangeClientStatusDto {
  @IsEnum(ClientStatusDto)
  status!: ClientStatusDto;
}
