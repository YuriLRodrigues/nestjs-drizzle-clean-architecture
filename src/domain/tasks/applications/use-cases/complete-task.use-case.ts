import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { type Either, left, right } from '@core/logic/either'

import type { Task } from '../../enterprise/entities/task.entity'
import { canAccessTask } from '../../enterprise/policies/task-access.policy'
import { TaskAlreadyCompletedError } from '../../errors/task-already-completed.error'
import { TaskNotFoundError } from '../../errors/task-not-found.error'
import { TasksRepository } from '../repositories/tasks.repository'

export type CompleteTaskInput = {
  actor: Actor
  taskId: string
}

export type CompleteTaskOutput = Either<TaskNotFoundError | TaskAlreadyCompletedError, { task: Task }>

@Injectable()
export class CompleteTaskUseCase {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async execute({ actor, taskId }: CompleteTaskInput): Promise<CompleteTaskOutput> {
    const task = await this.tasksRepository.findById(taskId)
    if (!task || !canAccessTask(actor, task)) return left(new TaskNotFoundError())
    if (task.isDone) return left(new TaskAlreadyCompletedError())

    task.complete()
    await this.tasksRepository.save(task)

    return right({ task })
  }
}
