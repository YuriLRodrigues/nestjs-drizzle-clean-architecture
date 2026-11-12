import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { type Either, left, right } from '@core/logic/either'

import type { Task } from '../../enterprise/entities/task.entity'
import { canAccessTask } from '../../enterprise/policies/task-access.policy'
import { TaskTitle } from '../../enterprise/value-objects/task-title'
import type { InvalidTaskTitleError } from '../../errors/invalid-task-title.error'
import { TaskNotFoundError } from '../../errors/task-not-found.error'
import { TasksRepository } from '../repositories/tasks.repository'
import { normalizeDescription } from './normalize-description'

export type UpdateTaskInput = {
  actor: Actor
  taskId: string
  /** Absent keeps the current title. */
  title?: string
  /** Absent keeps the current description; `null` or blank clears it. */
  description?: string | null
}

export type UpdateTaskOutput = Either<TaskNotFoundError | InvalidTaskTitleError, { task: Task }>

@Injectable()
export class UpdateTaskUseCase {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async execute({ actor, taskId, title, description }: UpdateTaskInput): Promise<UpdateTaskOutput> {
    const task = await this.tasksRepository.findById(taskId)
    if (!task || !canAccessTask(actor, task)) return left(new TaskNotFoundError())

    if (title !== undefined) {
      const titleOrError = TaskTitle.create(title)
      if (titleOrError.isLeft()) return left(titleOrError.value)
      task.rename(titleOrError.value)
    }

    if (description !== undefined) {
      task.describe(normalizeDescription(description))
    }

    await this.tasksRepository.save(task)

    return right({ task })
  }
}
