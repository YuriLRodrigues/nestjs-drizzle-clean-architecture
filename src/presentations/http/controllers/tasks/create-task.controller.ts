import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiCreatedResponse, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { CreateTaskUseCase } from '@domain/tasks/applications/use-cases/create-task.use-case'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ErrorResponseDto } from '../../errors/error-response.dto'
import { CreateTaskDto } from './dtos/create-task.dto'
import { TaskResponseDto } from './dtos/task-response.dto'
import { TaskViewModel } from './view-models/task.view-model'

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class CreateTaskController {
  constructor(private readonly createTask: CreateTaskUseCase) {}

  @Post()
  @HttpCode(201)
  @ApiCreatedResponse({ type: TaskResponseDto })
  @ApiUnprocessableEntityResponse({ type: ErrorResponseDto, description: '`TASK.INVALID_TITLE`' })
  async handle(@CurrentActor() actor: Actor, @Body() body: CreateTaskDto): Promise<TaskResponseDto> {
    const result = await this.createTask.execute({ actor, title: body.title, description: body.description })

    if (result.isLeft()) throw result.value

    return TaskViewModel.toHttp(result.value.task)
  }
}
