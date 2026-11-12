import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { Task } from '@domain/tasks/enterprise/entities/task.entity'
import { TaskTitle } from '@domain/tasks/enterprise/value-objects/task-title'

import type { NewTaskRow, TaskRow } from '../schema/tasks'

export class TaskMapper {
  static toDomain(row: TaskRow): Task {
    return Task.create(
      {
        ownerId: new UniqueEntityId(row.ownerId),
        title: TaskTitle.restore(row.title),
        description: row.description,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        completedAt: row.completedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(task: Task): NewTaskRow {
    return {
      id: task.id.toString(),
      ownerId: task.ownerId.toString(),
      title: task.title.value,
      description: task.description,
      status: task.status,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt,
    }
  }
}
