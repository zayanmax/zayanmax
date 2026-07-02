import { IsOptional, IsString, IsUUID } from 'class-validator';

export class AddProjectMemberDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsString()
  role?: string;
}
