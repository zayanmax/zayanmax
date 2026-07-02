import { IsString, MinLength } from 'class-validator';

export class CreateClientNoteDto {
  @IsString()
  @MinLength(1)
  noteText!: string;
}
