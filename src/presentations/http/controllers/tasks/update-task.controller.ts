import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { UpdateTaskUseCase } from '@domain/tasks/applications/use-cases/update-task.use-case'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ErrorResponseDto } from '../../errors/error-response.dto'
import { TaskResponseDto } from './dtos/task-response.dto'
import { UpdateTaskDto } from './dtos/update-task.dto'
import { TaskViewModel } from './view-models/task.view-model'

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks/:id')
export class UpdateTaskController {
  constructor(private readonly updateTask: UpdateTaskUseCase) {}

  @Patch()
  @ApiOkResponse({ type: TaskResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: '`TASK.NOT_FOUND`' })
  @ApiUnprocessableEntityResponse({ type: ErrorResponseDto, description: '`TASK.INVALID_TITLE`' })
  async handle(
    @CurrentActor() actor: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const result = await this.updateTask.execute({ actor, taskId: id, ...body })

    if (result.isLeft()) throw result.value

    return TaskViewModel.toHttp(result.value.task)
  }
}
