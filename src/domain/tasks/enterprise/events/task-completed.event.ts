import type { UniqueEntityId } from '@core/domain/unique-entity-id'
import type { DomainEvent } from '@core/events/domain-event'

import type { Task } from '../entities/task.entity'

export class TaskCompletedEvent implements DomainEvent {
  readonly occurredAt = new Date()

  constructor(readonly task: Task) {}

  getAggregateId(): UniqueEntityId {
    return this.task.id
  }
}
