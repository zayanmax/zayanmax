import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export enum ClientDocumentCategoryDto {
  CONTRACT = 'CONTRACT',
  TAX = 'TAX',
  PROPOSAL = 'PROPOSAL',
  IDENTITY = 'IDENTITY',
  OTHER = 'OTHER',
}

export class CreateClientDocumentDto {
  @IsString()
  @MinLength(2)
  fileName!: string;

  @IsString()
  @MinLength(2)
  storageKey!: string;

  @IsString()
  @MinLength(2)
  mimeType!: string;

  @IsInt()
  @Min(1)
  size!: number;

  @IsOptional()
  @IsEnum(ClientDocumentCategoryDto)
  category?: ClientDocumentCategoryDto;
}
