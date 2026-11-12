import { Injectable } from '@nestjs/common'

import { type Actor, isAdmin } from '@core/auth/actor'
import { type Either, right } from '@core/logic/either'
import type { Paginated, PaginationParams } from '@core/pagination/pagination'

import type { Task } from '../../enterprise/entities/task.entity'
import type { TaskStatus } from '../../enterprise/task-status'
import { TasksRepository } from '../repositories/tasks.repository'

export type ListTasksInput = PaginationParams & {
  actor: Actor
  status?: TaskStatus
  search?: string
}

export type ListTasksOutput = Either<never, { tasks: Paginated<Task> }>

/** Users list their own tasks; admins list everyone's. */
@Injectable()
export class ListTasksUseCase {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async execute({ actor, page, limit, status, search }: ListTasksInput): Promise<ListTasksOutput> {
    const tasks = await this.tasksRepository.findMany({
      page,
      limit,
      status,
      search: search?.trim() || undefined,
      ownerId: isAdmin(actor) ? undefined : actor.id,
    })

    return right({ tasks })
  }
}
