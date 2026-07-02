import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateTaskAttachmentDto {
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
}
