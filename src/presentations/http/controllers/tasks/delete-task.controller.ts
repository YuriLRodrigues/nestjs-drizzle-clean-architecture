import { Controller, Delete, HttpCode, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiBearerAuth, ApiNoContentResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { DeleteTaskUseCase } from '@domain/tasks/applications/use-cases/delete-task.use-case'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ErrorResponseDto } from '../../errors/error-response.dto'

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks/:id')
export class DeleteTaskController {
  constructor(private readonly deleteTask: DeleteTaskUseCase) {}

  @Delete()
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: '`TASK.NOT_FOUND`' })
  async handle(@CurrentActor() actor: Actor, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const result = await this.deleteTask.execute({ actor, taskId: id })

    if (result.isLeft()) throw result.value
  }
}
