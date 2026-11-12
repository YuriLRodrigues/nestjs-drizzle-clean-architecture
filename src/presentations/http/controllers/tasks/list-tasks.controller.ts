import { Controller, Get, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { ListTasksUseCase } from '@domain/tasks/applications/use-cases/list-tasks.use-case'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ListTasksQueryDto } from './dtos/list-tasks-query.dto'
import { TasksPageResponseDto } from './dtos/task-response.dto'
import { TaskViewModel } from './view-models/task.view-model'

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class ListTasksController {
  constructor(private readonly listTasks: ListTasksUseCase) {}

  @Get()
  @ApiOkResponse({ type: TasksPageResponseDto, description: "Your tasks, or everyone's for an admin. Newest first." })
  async handle(@CurrentActor() actor: Actor, @Query() query: ListTasksQueryDto): Promise<TasksPageResponseDto> {
    const result = await this.listTasks.execute({ actor, ...query })

    return TaskViewModel.toHttpPage(result.value.tasks)
  }
}
