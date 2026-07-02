import { OmitType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';

export class CreateSubtaskDto extends OmitType(CreateTaskDto, [
  'projectId',
  'parentTaskId',
] as const) {}
