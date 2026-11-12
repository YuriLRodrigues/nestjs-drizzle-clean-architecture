import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { Task, type TaskProps } from '@domain/tasks/enterprise/entities/task.entity'
import { TaskTitle } from '@domain/tasks/enterprise/value-objects/task-title'

export function makeTask(override: Partial<TaskProps> = {}, id?: UniqueEntityId): Task {
  return Task.create(
    {
      ownerId: new UniqueEntityId(),
      title: TaskTitle.restore('Write the README'),
      description: 'Explain how to run the project.',
      ...override,
    },
    id,
  )
}
