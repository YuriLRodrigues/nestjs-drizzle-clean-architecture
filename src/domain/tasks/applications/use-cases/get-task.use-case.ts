import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { type Either, left, right } from '@core/logic/either'

import type { Task } from '../../enterprise/entities/task.entity'
import { canAccessTask } from '../../enterprise/policies/task-access.policy'
import { TaskNotFoundError } from '../../errors/task-not-found.error'
import { TasksRepository } from '../repositories/tasks.repository'

export type GetTaskInput = {
  actor: Actor
  taskId: string
}

export type GetTaskOutput = Either<TaskNotFoundError, { task: Task }>

@Injectable()
export class GetTaskUseCase {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async execute({ actor, taskId }: GetTaskInput): Promise<GetTaskOutput> {
    const task = await this.tasksRepository.findById(taskId)
    if (!task || !canAccessTask(actor, task)) return left(new TaskNotFoundError())

    return right({ task })
  }
}
