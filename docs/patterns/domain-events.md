# Domain events

Use an event when something that happened in one place should trigger a side effect elsewhere (notify, log, update
another context) without the first place knowing about it.

## 1. Define the event (domain)

```ts
export class TaskCompletedEvent implements DomainEvent {
  readonly occurredAt = new Date()

  constructor(readonly task: Task) {}

  getAggregateId(): UniqueEntityId {
    return this.task.id
  }
}
```

## 2. Raise it in the aggregate

```ts
complete(now: Date = new Date()): void {
  if (this.isDone) return
  // ...
  this.addDomainEvent(new TaskCompletedEvent(this))
}
```

`addDomainEvent` stores the event and marks the aggregate. Nothing is dispatched yet.

## 3. The repository dispatches after the write

```ts
await this.drizzle.db.update(tasks).set(changes).where(eq(tasks.id, id))
await DomainEvents.dispatchEventsForAggregate(task.id)
```

Subscribers never see a change that was not saved.

## 4. Subscribe (infra)

```ts
@Injectable()
export class OnTaskCompleted implements EventHandler, OnModuleInit, OnModuleDestroy {
  private unregister?: () => void

  onModuleInit(): void {
    this.setupSubscriptions()
  }
  onModuleDestroy(): void {
    this.unregister?.()
  }

  setupSubscriptions(): void {
    this.unregister = DomainEvents.register<TaskCompletedEvent>((event) => this.handle(event), TaskCompletedEvent.name)
  }
}
```

Add it to `providers` in `infra/events/events.module.ts`.

- Handlers are awaited in order. **A subscriber catches its own errors**: a failed notification must not fail the
  request that completed the task.
- The bus is in-process. For work that must survive a crash or retry, the subscriber enqueues a job instead of doing
  the work.
