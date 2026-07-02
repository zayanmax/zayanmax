import { IsOptional, IsUUID } from 'class-validator';

export class AddTaskAssigneeDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;
}
