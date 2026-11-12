import type { Paginated } from '@core/pagination/pagination'
import type { Task } from '@domain/tasks/enterprise/entities/task.entity'

import type { TaskResponseDto, TasksPageResponseDto } from '../dtos/task-response.dto'

export class TaskViewModel {
  static toHttp(task: Task): TaskResponseDto {
    return {
      id: task.id.toString(),
      ownerId: task.ownerId.toString(),
      title: task.title.value,
      description: task.description,
      status: task.status,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt?.toISOString() ?? null,
      completedAt: task.completedAt?.toISOString() ?? null,
    }
  }

  static toHttpPage({ results, meta }: Paginated<Task>): TasksPageResponseDto {
    return { results: results.map((task) => TaskViewModel.toHttp(task)), meta }
  }
}
