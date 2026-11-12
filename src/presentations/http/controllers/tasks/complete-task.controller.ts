import { Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ApiBearerAuth, ApiConflictResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { CompleteTaskUseCase } from '@domain/tasks/applications/use-cases/complete-task.use-case'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ErrorResponseDto } from '../../errors/error-response.dto'
import { TaskResponseDto } from './dtos/task-response.dto'
import { TaskViewModel } from './view-models/task.view-model'

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks/:id/complete')
export class CompleteTaskController {
  constructor(private readonly completeTask: CompleteTaskUseCase) {}

  @Patch()
  @ApiOkResponse({ type: TaskResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: '`TASK.NOT_FOUND`' })
  @ApiConflictResponse({ type: ErrorResponseDto, description: '`TASK.ALREADY_COMPLETED`' })
  async handle(@CurrentActor() actor: Actor, @Param('id', ParseUUIDPipe) id: string): Promise<TaskResponseDto> {
    const result = await this.completeTask.execute({ actor, taskId: id })

    if (result.isLeft()) throw result.value

    return TaskViewModel.toHttp(result.value.task)
  }
}
