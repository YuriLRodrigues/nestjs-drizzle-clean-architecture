# Repositories and DI

## The contract lives in the domain

```ts
// domain/tasks/applications/repositories/tasks.repository.ts
export abstract class TasksRepository {
  abstract findById(id: string): Promise<Task | null>
  abstract findMany(params: FindManyTasksParams): Promise<Paginated<Task>>
  abstract create(task: Task): Promise<void>
  abstract save(task: Task): Promise<void>
  abstract delete(task: Task): Promise<void>
}
```

The abstract class is the **DI token**: use cases ask for `TasksRepository` in the constructor and Nest injects
whatever infra bound to it. The same goes for any port to the outside: `HashGenerator`, `HashComparer`,
`Encrypter`, a future `Mailer` or `Storage`.

Repository methods speak the domain: they take and return entities, value objects and `Paginated<T>`, never rows.

## The implementation lives in infra

```ts
@Injectable()
export class DrizzleTasksRepository implements TasksRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async save(task: Task): Promise<void> {
    const { id, ...changes } = TaskMapper.toPersistence(task)
    await this.drizzle.db.update(tasks).set(changes).where(eq(tasks.id, id))
    await DomainEvents.dispatchEventsForAggregate(task.id)
  }
}
```

```ts
// infra/database/database.module.ts
providers: [DrizzleService, { provide: TasksRepository, useClass: DrizzleTasksRepository }],
exports: [TasksRepository],
```

- `create`, `save` and `delete` dispatch the aggregate's events **after** the write.
- Mappers (`TaskMapper.toDomain` / `toPersistence`) are the only code that knows both the row and the entity.
- Search uses `ilike` with `containsPattern(term)`, which escapes `%`, `_` and `\`.
- Lists are ordered by `created_at desc, id desc`, so pagination is stable.

## Tests use the in-memory implementation

`test/repositories/in-memory-tasks.repository.ts` implements the same contract over an array, including the search
rule and the event dispatch. When you add a repository method, add it to both, and cover the Drizzle side in an e2e
test.
