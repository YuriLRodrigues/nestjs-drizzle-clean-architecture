# Entities and value objects

## Entity / aggregate root

```ts
export type TaskProps = { ownerId: UniqueEntityId; title: TaskTitle; status: TaskStatus; createdAt: Date; ... }

export class Task extends AggregateRoot<TaskProps> {
  get title(): TaskTitle {
    return this.props.title
  }

  rename(title: TaskTitle): void {
    this.props.title = title
    this.touch()
  }

  complete(now: Date = new Date()): void {
    if (this.isDone) return
    this.props.status = 'DONE'
    this.props.completedAt = now
    this.addDomainEvent(new TaskCompletedEvent(this))
  }

  static create(props: Optional<TaskProps, 'status' | 'createdAt' | ...>, id?: UniqueEntityId): Task {
    return new Task({ ...props, status: props.status ?? 'PENDING', createdAt: props.createdAt ?? new Date() }, id)
  }
}
```

- Props are a `type` (not an `interface`), private to the entity, exposed through getters.
- Changes happen through **intention-revealing methods** (`rename`, `complete`), never setters.
- `create()` fills defaults; passing an `id` rebuilds an existing entity (mappers, factories).
- Extend `AggregateRoot` when the entity raises domain events or is loaded/saved by a repository; plain `Entity`
  otherwise. Equality is by id.
- Dates are injected (`complete(now)`) where tests need to control them.

## Value object

```ts
export class TaskTitle extends ValueObject<{ value: string }> {
  static create(raw: string): Either<InvalidTaskTitleError, TaskTitle> {
    const value = raw.trim().replace(/\s+/g, ' ')
    if (value.length === 0 || value.length > TaskTitle.MAX_LENGTH)
      return left(new InvalidTaskTitleError(TaskTitle.MAX_LENGTH))
    return right(new TaskTitle({ value }))
  }

  static restore(value: string): TaskTitle {
    return new TaskTitle({ value })
  }
}
```

- The constructor is private: the only ways in are `create()` (validates, returns `Either`) and `restore()` (trusted
  data from the database, no validation).
- Immutable; equal when the props are equal.
- Normalise in `create()` (trim, lower-case), so equal inputs become equal values.

## Policy

A rule that only reads entities is a pure function in `enterprise/policies/`, unit tested and shared by use cases:

```ts
export function canAccessTask(actor: Actor, task: Task): boolean {
  return isAdmin(actor) || task.ownerId.toString() === actor.id
}
```
