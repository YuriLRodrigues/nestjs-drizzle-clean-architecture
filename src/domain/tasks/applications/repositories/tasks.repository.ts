import type { Paginated, PaginationParams } from '@core/pagination/pagination'

import type { Task } from '../../enterprise/entities/task.entity'
import type { TaskStatus } from '../../enterprise/task-status'

export type FindManyTasksParams = PaginationParams & {
  /** Only this owner's tasks; omitted for admins. */
  ownerId?: string
  status?: TaskStatus
  /** Case-insensitive match on title or description. */
  search?: string
}

/** `create`, `save` and `delete` dispatch the aggregate's domain events after the write succeeds. */
export abstract class TasksRepository {
  abstract findById(id: string): Promise<Task | null>
  /** Newest first. */
  abstract findMany(params: FindManyTasksParams): Promise<Paginated<Task>>
  abstract create(task: Task): Promise<void>
  abstract save(task: Task): Promise<void>
  abstract delete(task: Task): Promise<void>
}
