import type { UniqueEntityId } from '../domain/unique-entity-id'

/** Something that happened in the domain. Named in the past tense: `TaskCompletedEvent`. */
export interface DomainEvent {
  readonly occurredAt: Date
  getAggregateId(): UniqueEntityId
}
