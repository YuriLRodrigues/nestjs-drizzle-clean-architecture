import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { GetTaskUseCase } from '@domain/tasks/applications/use-cases/get-task.use-case'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ErrorResponseDto } from '../../errors/error-response.dto'
import { TaskResponseDto } from './dtos/task-response.dto'
import { TaskViewModel } from './view-models/task.view-model'

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks/:id')
export class GetTaskController {
  constructor(private readonly getTask: GetTaskUseCase) {}

  @Get()
  @ApiOkResponse({ type: TaskResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: '`TASK.NOT_FOUND`' })
  async handle(@CurrentActor() actor: Actor, @Param('id', ParseUUIDPipe) id: string): Promise<TaskResponseDto> {
    const result = await this.getTask.execute({ actor, taskId: id })

    if (result.isLeft()) throw result.value

    return TaskViewModel.toHttp(result.value.task)
  }
}
