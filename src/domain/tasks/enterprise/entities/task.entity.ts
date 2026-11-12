import { AggregateRoot } from '@core/domain/aggregate-root'
import type { UniqueEntityId } from '@core/domain/unique-entity-id'
import type { Optional } from '@core/logic/optional'

import { TaskCompletedEvent } from '../events/task-completed.event'
import type { TaskStatus } from '../task-status'
import type { TaskTitle } from '../value-objects/task-title'

export type TaskProps = {
  ownerId: UniqueEntityId
  title: TaskTitle
  description: string | null
  status: TaskStatus
  createdAt: Date
  updatedAt: Date | null
  completedAt: Date | null
}

export class Task extends AggregateRoot<TaskProps> {
  get ownerId(): UniqueEntityId {
    return this.props.ownerId
  }

  get title(): TaskTitle {
    return this.props.title
  }

  get description(): string | null {
    return this.props.description
  }

  get status(): TaskStatus {
    return this.props.status
  }

  get isDone(): boolean {
    return this.props.status === 'DONE'
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt
  }

  get completedAt(): Date | null {
    return this.props.completedAt
  }

  rename(title: TaskTitle): void {
    this.props.title = title
    this.touch()
  }

  describe(description: string | null): void {
    this.props.description = description
    this.touch()
  }

  /** Marks the task as done and raises `TaskCompletedEvent`. Completing a done task changes nothing. */
  complete(now: Date = new Date()): void {
    if (this.isDone) return

    this.props.status = 'DONE'
    this.props.completedAt = now
    this.touch(now)
    this.addDomainEvent(new TaskCompletedEvent(this))
  }

  private touch(now: Date = new Date()): void {
    this.props.updatedAt = now
  }

  static create(
    props: Optional<TaskProps, 'description' | 'status' | 'createdAt' | 'updatedAt' | 'completedAt'>,
    id?: UniqueEntityId,
  ): Task {
    return new Task(
      {
        ...props,
        description: props.description ?? null,
        status: props.status ?? 'PENDING',
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
        completedAt: props.completedAt ?? null,
      },
      id,
    )
  }
}
