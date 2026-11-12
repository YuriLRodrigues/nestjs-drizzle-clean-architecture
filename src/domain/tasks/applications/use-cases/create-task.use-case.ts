import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { type Either, left, right } from '@core/logic/either'

import { Task } from '../../enterprise/entities/task.entity'
import { TaskTitle } from '../../enterprise/value-objects/task-title'
import type { InvalidTaskTitleError } from '../../errors/invalid-task-title.error'
import { TasksRepository } from '../repositories/tasks.repository'
import { normalizeDescription } from './normalize-description'

export type CreateTaskInput = {
  actor: Actor
  title: string
  description?: string | null
}

export type CreateTaskOutput = Either<InvalidTaskTitleError, { task: Task }>

@Injectable()
export class CreateTaskUseCase {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async execute({ actor, title, description }: CreateTaskInput): Promise<CreateTaskOutput> {
    const titleOrError = TaskTitle.create(title)
    if (titleOrError.isLeft()) return left(titleOrError.value)

    const task = Task.create({
      ownerId: new UniqueEntityId(actor.id),
      title: titleOrError.value,
      description: normalizeDescription(description),
    })

    await this.tasksRepository.create(task)

    return right({ task })
  }
}
