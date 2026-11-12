import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { type Either, left, right } from '@core/logic/either'

import { canAccessTask } from '../../enterprise/policies/task-access.policy'
import { TaskNotFoundError } from '../../errors/task-not-found.error'
import { TasksRepository } from '../repositories/tasks.repository'

export type DeleteTaskInput = {
  actor: Actor
  taskId: string
}

export type DeleteTaskOutput = Either<TaskNotFoundError, null>

@Injectable()
export class DeleteTaskUseCase {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async execute({ actor, taskId }: DeleteTaskInput): Promise<DeleteTaskOutput> {
    const task = await this.tasksRepository.findById(taskId)
    if (!task || !canAccessTask(actor, task)) return left(new TaskNotFoundError())

    await this.tasksRepository.delete(task)

    return right(null)
  }
}
