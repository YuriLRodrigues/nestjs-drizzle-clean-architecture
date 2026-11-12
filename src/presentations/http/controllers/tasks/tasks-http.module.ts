import { Module } from '@nestjs/common'

import { CompleteTaskUseCase } from '@domain/tasks/applications/use-cases/complete-task.use-case'
import { CreateTaskUseCase } from '@domain/tasks/applications/use-cases/create-task.use-case'
import { DeleteTaskUseCase } from '@domain/tasks/applications/use-cases/delete-task.use-case'
import { GetTaskUseCase } from '@domain/tasks/applications/use-cases/get-task.use-case'
import { ListTasksUseCase } from '@domain/tasks/applications/use-cases/list-tasks.use-case'
import { UpdateTaskUseCase } from '@domain/tasks/applications/use-cases/update-task.use-case'
import { DatabaseModule } from '@infra/database/database.module'

import { CompleteTaskController } from './complete-task.controller'
import { CreateTaskController } from './create-task.controller'
import { DeleteTaskController } from './delete-task.controller'
import { GetTaskController } from './get-task.controller'
import { ListTasksController } from './list-tasks.controller'
import { UpdateTaskController } from './update-task.controller'

@Module({
  imports: [DatabaseModule],
  controllers: [
    CreateTaskController,
    ListTasksController,
    GetTaskController,
    UpdateTaskController,
    CompleteTaskController,
    DeleteTaskController,
  ],
  providers: [
    CreateTaskUseCase,
    ListTasksUseCase,
    GetTaskUseCase,
    UpdateTaskUseCase,
    CompleteTaskUseCase,
    DeleteTaskUseCase,
  ],
})
export class TasksHttpModule {}
