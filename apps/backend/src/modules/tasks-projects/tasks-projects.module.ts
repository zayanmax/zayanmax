import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { TasksController } from './tasks.controller';
import { TasksProjectsService } from './tasks-projects.service';

@Module({
  controllers: [ProjectsController, TasksController],
  providers: [TasksProjectsService],
})
export class TasksProjectsModule {}
